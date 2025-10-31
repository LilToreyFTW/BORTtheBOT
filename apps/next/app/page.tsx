import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 16 }}>
      <h1 style={{ fontSize: 20, marginBottom: 12 }}>BORT Next</h1>
      <ul>
        <li>
          <Link href="/builder">Go to Builder</Link>
        </li>
      </ul>
    </main>
  );
}


