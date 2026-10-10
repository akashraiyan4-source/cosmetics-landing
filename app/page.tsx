export default function Home() {
  return (
    <main style={{ padding: "40px", fontFamily: "sans-serif", textAlign: "center", color: "#fff", background: "#000", minHeight: "100vh" }}>
      <h1>Welcome to Smileway Studio</h1>
      <p>Please visit our niches:</p>
      <div style={{ marginTop: "20px" }}>
        <a href="/niches/dental" style={{ color: "#00df82", marginRight: "20px" }}>Dental Niche</a>
        <a href="/niches/cosmetics" style={{ color: "#00df82" }}>Cosmetics Niche</a>
      </div>
    </main>
  );
}
