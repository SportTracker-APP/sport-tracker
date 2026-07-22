import styles from "../login.module.css";

type LoginStatusMessageProps = {
  tone: "error" | "success";
  children: React.ReactNode;
};

export function LoginStatusMessage({
  tone,
  children,
}: LoginStatusMessageProps) {
  return (
    <div
      className={`${styles.statusMessage} ${
        tone === "success" ? styles.statusSuccess : styles.statusError
      }`}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
