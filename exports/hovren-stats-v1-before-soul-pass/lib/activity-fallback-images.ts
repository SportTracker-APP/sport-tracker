export const activityFallbackImages = [
  "https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&cs=tinysrgb&w=1800",
  "https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=1800",
  "https://images.pexels.com/photos/18193574/pexels-photo-18193574.jpeg?auto=compress&cs=tinysrgb&w=1800",
  "https://images.pexels.com/photos/26382487/pexels-photo-26382487.jpeg?auto=compress&cs=tinysrgb&w=1800",
  "https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=1800",
  "https://images.pexels.com/photos/29518500/pexels-photo-29518500.jpeg?auto=compress&cs=tinysrgb&w=1800",
  "https://images.pexels.com/photos/33874841/pexels-photo-33874841.jpeg?auto=compress&cs=tinysrgb&w=1800",
  "https://images.unsplash.com/photo-1519522880597-3a4a62fbf846?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
  "https://images.unsplash.com/photo-1543762339-f2a172f2cbad?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
  "https://images.unsplash.com/photo-1562593028-2e975fe28a0c?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
  "https://images.unsplash.com/photo-1585927700375-d154b1943dc6?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
  "https://images.unsplash.com/photo-1603392439468-0e0cc5790778?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
  "https://images.unsplash.com/photo-1618886822219-76bda3c783a5?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
  "https://images.unsplash.com/photo-1658815366217-f93c48e79269?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
  "https://images.unsplash.com/photo-1720631265130-d5bb2fd069d9?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
  "https://images.unsplash.com/photo-1723764881665-5b40cea01c9b?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
  "https://images.unsplash.com/photo-1750834368539-2b80373afd22?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
] as const;

export function pickRandomActivityFallbackImage() {
  return activityFallbackImages[
    Math.floor(Math.random() * activityFallbackImages.length)
  ]!;
}
