import { useRef, useState } from "react";

function SpeechToText() {
  const API_KEY = "76940893cd804e2b933e3e55b027c56e";
  const [file, setFile] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunks = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    streamRef.current = stream;

    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunks.current = [];
    console.log(mediaRecorderRef.current);

    mediaRecorderRef.current.ondataavailable = (e) => {
      console.log(e);
      audioChunks.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
      const audioFile = new File([audioBlob], "recording.wav", {
        type: "audio/wav",
      });
      setFile(audioFile);
      console.log(audioBlob);
      const url = URL.createObjectURL(audioBlob);
      setAudioURL(url);
      return () => URL.revokeObjectURL(url);
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setAudioURL(URL.createObjectURL(e.target.files[0]));
  };


  const addData=async(speechText,audioUrl)=>{
    try{
      const response=await fetch("https://speechtotext-2.onrender.com/",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          "text":speechText,
          "audioUrl":audioUrl
        })
      })

      let result=await response.json();

      if(response.ok){
        console.log(result, "data added successfully");
        alert( "data added successfully")
      }
    }
    catch(e){
      console.log(e);
      alert("Error occurred while saving data in the DB")
    }
  }

  const transcribeAudio = async () => {
    if (!file) {
      alert("Please upload or record an audio file.");
      return;
    }

    setUploading(true);

    try {
      // Step 1: Upload
      const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
        method: "POST",
        headers: {
          authorization: API_KEY,
        },
        body: file,
      });
      const uploadData = await uploadRes.json();
      const audioUrl = uploadData.upload_url;

      // Step 2: Start transcription
      const transcriptRes = await fetch(
        "https://api.assemblyai.com/v2/transcript",
        {
          method: "POST",
          headers: {
            authorization: API_KEY,
            "content-type": "application/json",
          },
          body: JSON.stringify({ audio_url: audioUrl }),
        }
      );

      const transcriptData = await transcriptRes.json();
      const transcriptId = transcriptData.id;

      // Step 3: Polling for completion
      let completed = false;
      let finalText = "";

      while (!completed) {
        const resultRes = await fetch(
          `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
          {
            headers: { authorization: API_KEY },
          }
        );

        const result = await resultRes.json();

        if (result.status === "completed") {
          finalText = result.text;
          completed = true;
          addData(finalText,audioURL);

        } else if (result.status === "error") {
          throw new Error("Transcription failed");
        }

        await new Promise((res) => setTimeout(res, 3000)); // wait 3 sec
      }

      setTranscript(finalText);
    } catch (e) {
      console.log(e);
      alert("Something went wrong during transcription.");
    }

    setUploading(false);
  };

  return (
    <div className="flex justify-center mt-[3rem]">
      <div className="flex flex-col justify-start items-center gap-5 w-[25rem] h-[32rem] bg-white py-[2rem] px-[1rem] shadow-2xl rounded-2xl">
        <h1 className="text-3xl font-semibold">🎙️ Speech to Text</h1>
        <div className="flex justify-between gap-4 w-full">
          <label
            className={`h-[3rem] w-[50%] border border-gray-400 bg-white cursor-pointer px-4 py-2 text-center ${isRecording ? "opacity-50 cursor-not-allowed" : ""}  ${file ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span>📁 Upload File</span>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isRecording || file}
            />
          </label>
          {isRecording ? (
            <button
              type="button"
              className="h-[3rem]  w-[50%] bg-white border border-gray-400 cursor-pointer"
              onClick={stopRecording}
            >
              Stop Recording
            </button>
          ) : (
            <button
              type="button"
              className={`h-[3rem]  w-[50%] bg-white border border-gray-400 cursor-pointer ${file ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={startRecording}
              disabled={file}
            >
              🔴 Start Recording
            </button>
          )}
        </div>
        
        {audioURL && (
          <div className="w-full">
            <p className="text-sm text-gray-600 mb-2">🎧 Preview:</p>
            <audio
              controls
              src={audioURL}
              className="w-full h-[3rem] bg-gray-100 rounded shadow-md"
            />
          </div>
        )}
        <button
          type="button"
          disabled={uploading || transcript}
          className={`max-h-[3rem] h-full w-full rounded-lg text-white text-xl cursor-pointer ${
            uploading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-700"
          }`}
          onClick={transcribeAudio}
        >
          {uploading ? "Converting..." : "Convert"}
        </button>
        <div className="w-full max-h-[40%] h-full border border-gray-400 bg-white p-2 overflow-y-auto rounded shadow-inner">
          {transcript === null ? (
            <p className="text-gray-500 italic">Transcript will appear here.</p>
          ) : uploading ? (
            <p className="text-blue-500 italic">Converting... please wait</p>
          ) : (
            <p className="whitespace-pre-wrap">{transcript}</p>
          )}
        </div>
        <button className="w-[6rem] min-h-[2rem] bg-red-500 text-white text-sm font-semibold rounded-lg cursor-pointer" onClick={()=>{
          setFile(false)
          setTranscript(null)
          setAudioURL("")
        }}>Clear Text</button>
      </div>
      
    </div>
  );
}

export default SpeechToText;
