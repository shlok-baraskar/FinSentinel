import random

# ─── Realistic transaction pool ───────────────────────────────────────────────
# Each entry: (merchant, location, amount_range, risk_weight)
SAFE_TRANSACTIONS = [
    ("Amazon",            "Mumbai, India",      (10,    500)),
    ("Netflix",           "Bangalore, India",   (10,    20)),
    ("Swiggy",            "Delhi, India",       (100,   800)),
    ("Zomato",            "Mumbai, India",      (150,   600)),
    ("Spotify",           "London, UK",         (10,    15)),
    ("Apple Store",       "New York, USA",      (1,     50)),
    ("Google Play",       "Bangalore, India",   (50,    500)),
    ("Walmart",           "New York, USA",      (20,    300)),
    ("Local Restaurant",  "Mumbai, India",      (200,   800)),
    ("Shell Gas Station", "London, UK",         (500,   3000)),
    ("Uber",              "Singapore",          (100,   500)),
    ("Flipkart",          "Delhi, India",       (500,   5000)),
    ("Steam",             "Tokyo, Japan",       (500,   3000)),
    ("Zara",              "Paris, France",      (500,   5000)),
    ("Starbucks",         "New York, USA",      (200,   800)),
]

MEDIUM_TRANSACTIONS = [
    ("Booking.com",    "Dubai, UAE",        (5000,  20000)),
    ("eBay",           "Berlin, Germany",   (1000,  8000)),
    ("Aliexpress",     "Shanghai, China",   (500,   5000)),
    ("Airbnb",         "Paris, France",     (2000,  8000)),
    ("Foreign Exchange","Dubai, UAE",       (2000,  15000)),
]

HIGH_RISK_TRANSACTIONS = [
    ("Western Union",      "Lagos, Nigeria",    (5000,  50000)),
    ("Crypto Exchange",    "Moscow, Russia",    (5000,  80000)),
    ("Unknown Merchant",   "Unknown Location",  (1000,  99999)),
    ("Unknown Online Store","Lagos, Nigeria",   (3000,  99999)),
    ("Unknown Online Store","Unknown Location", (5000,  99999)),
    ("Crypto Exchange",    "Unknown Location",  (8000,  99999)),
    ("Foreign Exchange",   "Moscow, Russia",    (10000, 99999)),
]

CARD_POOL = [
    "1234", "5678", "9012", "3456", "7890",
    "2211", "4433", "6655", "8877", "0099",
    "1111", "2222", "3333", "4444", "9999",
]


def generate_transaction() -> dict:
    """
    Generate a single realistic simulated transaction.
    70% safe, 20% medium risk, 10% high risk — mirrors real fraud distribution.
    """
    roll = random.random()

    if roll < 0.70:
        merchant, location, amount_range = random.choice(SAFE_TRANSACTIONS)
    elif roll < 0.90:
        merchant, location, amount_range = random.choice(MEDIUM_TRANSACTIONS)
    else:
        merchant, location, amount_range = random.choice(HIGH_RISK_TRANSACTIONS)

    amount = round(random.uniform(amount_range[0], amount_range[1]), 2)
    card   = random.choice(CARD_POOL)

    return {
        "amount":     amount,
        "merchant":   merchant,
        "location":   location,
        "card_last4": card,
    }


def get_simulation_batch(size: int = 1) -> list:
    """Generate a batch of simulated transactions."""
    return [generate_transaction() for _ in range(size)]