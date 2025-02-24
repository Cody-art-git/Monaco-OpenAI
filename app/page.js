"use client"

import { Messages } from "openai/resources/chat/completions/messages";
// import Image from "next/image";
import { useEffect, useState } from "react";

export const pipedrive_url = "https://monacosolicitors-sandbox-304aa5.pipedrive.com"
const pipedrive_key = "5f1a214cccc91d1db8e565d8be22fbbd9691584b"

export default function Home() {
  const [text, setText] = useState("");
  const [salesData, setSalesData] = useState(null);
  const [result, setResult] = useState("");
  const handleChange = (e) => {
    setText(e.target.value);
  }
  const handleSendMessage = async () => {
    if (!text || !text.length || !salesData) {
      alert("enter a message or no sales data")
      return;
    }
    // process message
    try {
      const res = await fetch("/api/chat", {
        method: "post",
        body: JSON.stringify({ text, data: salesData.data.slice(0, 10) }),
        headers: {
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      setResult(data.data);
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    async function fetchSalesData() {
      try {
        const res = await fetch(`${pipedrive_url}/api/v1/deals`, {
          method: "get",
          headers: {
            "x-api-token": pipedrive_key
          }
        })
        const data = await res.json();
        console.log(data);
        setSalesData(data);
      } catch (err) {
        console.log(err);
      }
    }
    fetchSalesData();
  }, [])
  return (
    <div className="flex min-h-100vh h-full w-full flex-col justify-center items-center">
      <div className="sm:w-[600px] w-[400px] h-[400px] bg-gray-300">
        <textarea defaultValue={result} readOnly className="w-full h-full border" />
      </div>
      <div className="flex items-center sm:w-[600px] w-[400px]">
        <input type="text" onChange={handleChange} className="grow border border-1" />
        <button className="p-4 bg-blue-400" onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
}
