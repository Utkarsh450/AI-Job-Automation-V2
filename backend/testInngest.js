async function check() {
  try {
    const res = await fetch("http://localhost:8000/api/inngest", {
        method: "PUT"
    });
    console.log(await res.text());
  } catch(e) {
    console.log("Error:", e.message);
  }
}
check();
