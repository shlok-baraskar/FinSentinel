import numpy as np
import hashlib
from datetime import datetime


# ─── Risk knowledge base ──────────────────────────────────────────────────────
# These mirror real-world fraud risk signals used by banks

HIGH_RISK_MERCHANTS = {
    'unknown online store': 0.85,
    'crypto exchange':      0.75,
    'foreign exchange':     0.65,
}

MEDIUM_RISK_MERCHANTS = {
    'uber':                 0.25,
    'shell gas station':    0.15,
}

LOW_RISK_MERCHANTS = {
    'amazon':               0.05,
    'netflix':               0.03,
    'walmart':                0.04,
    'apple store':            0.06,
    'local restaurant':       0.08,
}

HIGH_RISK_LOCATIONS = {
    'lagos, nigeria':        0.80,
    'moscow, russia':        0.70,
    'unknown location':      0.90,
}

MEDIUM_RISK_LOCATIONS = {
    'dubai, uae':             0.30,
    'singapore':               0.15,
}

LOW_RISK_LOCATIONS = {
    'mumbai, india':           0.05,
    'bangalore, india':        0.05,
    'new york, usa':           0.08,
    'london, uk':               0.07,
}


def _get_risk_score(value: str, high: dict, medium: dict, low: dict, default: float = 0.4) -> float:
    """Look up risk score for a merchant/location, case-insensitive."""
    key = value.strip().lower()
    if key in high:
        return high[key]
    if key in medium:
        return medium[key]
    if key in low:
        return low[key]
    return default  # unknown entities get medium-high default risk


def _deterministic_noise(seed_string: str, index: int) -> float:
    """
    Generates consistent pseudo-random noise from a string seed.
    Ensures same transaction details always produce same features (reproducible).
    """
    hash_val = int(hashlib.md5(f"{seed_string}_{index}".encode()).hexdigest(), 16)
    rng = np.random.RandomState(hash_val % (2**32))
    return rng.normal(0, 1)


def engineer_features(
    amount: float,
    merchant: str,
    location: str,
    card_last4: str,
    feature_names: list
) -> dict:
    """
    Converts a real-world transaction into the 28 PCA-style features (V1-V28)
    plus NormAmount and NormTime, using risk-based simulation.

    This mirrors what real fraud systems do when prototyping before
    full bank data integration is available.
    """
    merchant_risk = _get_risk_score(merchant, HIGH_RISK_MERCHANTS, MEDIUM_RISK_MERCHANTS, LOW_RISK_MERCHANTS)
    location_risk = _get_risk_score(location, HIGH_RISK_LOCATIONS, MEDIUM_RISK_LOCATIONS, LOW_RISK_LOCATIONS)

    # Time-of-day risk (late night = higher risk, mirrors real fraud patterns)
    current_hour = datetime.now().hour
    if 0 <= current_hour <= 5:
        time_risk = 0.6
    elif 6 <= current_hour <= 9 or 18 <= current_hour <= 22:
        time_risk = 0.2
    else:
        time_risk = 0.1

    # Amount risk (very high or unusually precise amounts are riskier)
    if amount > 5000:
        amount_risk = 0.7
    elif amount > 1000:
        amount_risk = 0.4
    elif amount < 1:
        amount_risk = 0.5  # micro-transactions can indicate card testing
    else:
        amount_risk = 0.1

    # Combined risk signal — this drives the feature simulation
    raw_risk = (merchant_risk * 0.4) + (location_risk * 0.35) + (time_risk * 0.15) + (amount_risk * 0.1)
    # Apply a sigmoid-like curve to spread mid-range risk more clearly
    combined_risk = 1 / (1 + np.exp(-8 * (raw_risk - 0.35)))

    seed = f"{merchant}_{location}_{card_last4}_{round(amount, 2)}"

    # Key fraud-indicator features based on real dataset correlation analysis
    # (V14, V12, V10, V17, V3, V7 are most predictive of fraud in this dataset)
    HIGH_IMPACT_FEATURES = {1, 3, 4, 7, 9, 10, 11, 12, 14, 16, 17, 18, 21}

    features = {}
    for name in feature_names:
        if name in ('NormAmount', 'NormTime'):
            continue
        idx = int(name.replace('V', '')) if name.startswith('V') else 0
        noise = _deterministic_noise(seed, idx) * 0.5  # reduce randomness

        # Risk maps smoothly to feature shift — linear, not exponential
        risk_multiplier = 9.0 if idx in HIGH_IMPACT_FEATURES else 2.5
        risk_shift = -combined_risk * risk_multiplier

        features[name] = round(float(noise + risk_shift), 4)

    # Normalize amount same way as training data
    features['NormAmount'] = round((amount - 88.35) / 250.12, 4)
    features['NormTime'] = round(_deterministic_noise(seed, 999) * 0.5, 4)

    return features