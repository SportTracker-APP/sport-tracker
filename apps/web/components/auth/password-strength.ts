export function getPasswordStrength(password: string) {
  if (password.length < 6) {
    return {
      label: "Faible",
      width: "33%",
      color: "bg-red-500",
    };
  }

  if (password.length < 10) {
    return {
      label: "Moyen",
      width: "66%",
      color: "bg-yellow-500",
    };
  }

  return {
    label: "Fort",
    width: "100%",
    color: "bg-green-500",
  };
}
