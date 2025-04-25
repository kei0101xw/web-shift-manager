import { useEffect, useState } from "react";
import './App.css';

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:8080/api/hello")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h1>バックエンドとの接続テスト</h1>
      <div className="title">
        <strong>{message}</strong>
      </div>
      <p>
        ↑黒帯の中にメッセージが表示されていたら成功
      </p>
    </div>
  );
}

export default App;
