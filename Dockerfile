# Utilisation d'une image Python légère
FROM python:3.9-slim

# Définition du dossier de travail
WORKDIR /app

# Installation des dépendances système nécessaires
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copie du fichier des dépendances
COPY requirements.txt .

# Installation des bibliothèques Python (pandas, scikit-learn, flask, etc.)
RUN pip install --no-cache-dir -r requirements.txt

# Copie de tout le code source (app.py, model.pkl, etc.)
COPY . .

# Exposition du port interne de l'application
EXPOSE 5000

# Commande pour lancer l'application
CMD ["python", "app.py"]