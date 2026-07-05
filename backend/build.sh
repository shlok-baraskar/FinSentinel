#!/bin/bash
set -e

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Downloading fraud dataset from Kaggle..."
mkdir -p ml/data
mkdir -p ml/saved_model

# Download dataset using Kaggle API
kaggle datasets download -d mlg-ulb/creditcardfraud -p ml/data --unzip

echo "Training fraud detection model..."
python ml/train_model.py

echo "Build complete — model trained and ready!"