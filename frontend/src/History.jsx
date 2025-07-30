import React, { useEffect, useState } from "react";

const History = () => {
  const [data, setData] = useState([]);

  const fetchHistory = async () => {
    const res = await fetch("https://speechtotext-2.onrender.com/data");
    const result = await res.json();
    setData(result);
  };

  const handleDelete = async (id) => {
    await fetch(`https://speechtotext-2.onrender.com/delete/${id}`, { method: "DELETE" });
    fetchHistory();
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Transcription History</h2>
      {data.map((item) => (
        <div key={item._id} className="mb-4 p-2 border rounded shadow">
          <p className="font-semibold">{item.text}</p>
          <audio src={item.audioUrl} controls className="mt-2 w-full" />
          <button
            className="mt-2 text-red-500"
            onClick={() => handleDelete(item._id)}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};

export default History;
