export default function TestPage() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Server is Working\!</h1>
      <p>Time: {new Date().toLocaleString()}</p>
      <a href="/">Go to Dashboard</a>
    </div>
  )
}
