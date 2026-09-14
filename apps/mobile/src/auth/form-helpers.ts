import { ApiError } from '@/src/api/client';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) {
    return 'Renseigne ton adresse email.';
  }

  if (!EMAIL_PATTERN.test(email.trim())) {
    return 'Cette adresse email ne semble pas valide.';
  }

  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (!password) {
    return 'Renseigne ton mot de passe.';
  }

  if (password.length < 8 || password.length > 72) {
    return 'Utilise entre 8 et 72 caractères.';
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Ajoute au moins une lettre et un chiffre.';
  }

  return undefined;
}

export function getLoginError(error: unknown): string {
  if (error instanceof ApiError) {
    const normalizedMessage = error.message.toLocaleLowerCase('fr');

    if (normalizedMessage.includes('vérifier')) {
      return 'Vérifie ton adresse email avant de te connecter.';
    }

    if (normalizedMessage.includes('bloqué')) {
      return 'Ce compte est actuellement bloqué.';
    }

    if (error.status === 401) {
      return 'Email ou mot de passe incorrect.';
    }

    if (error.status === 429) {
      return 'Trop de tentatives. Réessaie dans quelques instants.';
    }
  }

  return 'Connexion impossible pour le moment. Vérifie ton réseau et réessaie.';
}

export function getRegistrationError(error: unknown): string {
  if (error instanceof ApiError) {
    if (
      error.status === 429 ||
      error.message.toLowerCase().includes('tentatives')
    ) {
      return 'Trop de tentatives. Réessaie dans quelques instants.';
    }

    if (error.status === 400) {
      return 'Impossible de créer ce compte avec ces informations.';
    }
  }

  return 'Inscription impossible pour le moment. Vérifie ton réseau et réessaie.';
}
