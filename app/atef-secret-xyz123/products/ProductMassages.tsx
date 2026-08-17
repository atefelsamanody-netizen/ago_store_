"use client";

type Props = {
  messages: string[];
  setMessages: React.Dispatch<React.SetStateAction<string[]>>;
};

export default function ProductMassages({
  messages,
  setMessages,
}: Props) {

  function updateMessage(index: number, value: string) {
    const copy = [...messages];
    copy[index] = value;
    setMessages(copy);
  }

  function addMessage() {
    setMessages([...messages, ""]);
  }

  function removeMessage(index: number) {
    const copy = [...messages];
    copy.splice(index, 1);
    setMessages(copy);
  }

  return (
    <div style={{ marginTop: 25 }}>

      <h3
        style={{
          color: "#111",
          marginBottom: 10,
        }}
      >
        Hidden Messages
      </h3>

      {messages.map((msg, index) => (

        <div
          key={index}
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 10,
          }}
        >

          <input
            value={msg}
            placeholder={`Message ${index + 1}`}
            onChange={(e) =>
              updateMessage(index, e.target.value)
            }
            style={{
              flex: 1,
            }}
          />

          <button
            type="button"
            onClick={() => removeMessage(index)}
            style={{
              width: 40,
              background: "#ff4d4f",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            ✕
          </button>

        </div>

      ))}

      <button
        type="button"
        onClick={addMessage}
        style={{
          marginTop: 10,
          background: "#d4af37",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          padding: "10px 20px",
          cursor: "pointer",
        }}
      >
        + Add Message
      </button>

    </div>
  );
}