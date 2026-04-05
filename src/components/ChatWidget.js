import { useMemo, useState } from "react";

const quickHints = [
  "Bạn có thể hỏi: Làm sao chọn kích cỡ phù hợp?",
  "Bạn có thể hỏi: Cách thanh toán và nhận đồ?",
  "Bạn có thể hỏi: Chính sách đổi/trả khi trễ lịch?"
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      content: "Xin chào! Mình là trợ lý RentWear, bạn cần hỗ trợ gì?"
    }
  ]);

  const hint = useMemo(
    () => quickHints[Math.floor(Math.random() * quickHints.length)],
    []
  );

  const handleSend = () => {
    const content = input.trim();

    if (!content) {
      return;
    }

    const userMessage = {
      id: Date.now(),
      sender: "user",
      content
    };

    const replyMessage = {
      id: Date.now() + 1,
      sender: "bot",
      content:
        "Mình đã ghi nhận câu hỏi. Bạn có thể gửi nội dung này cho đội CSKH để được phản hồi nhanh hơn."
    };

    setMessages((previous) => [...previous, userMessage, replyMessage]);
    setInput("");
  };

  return (
    <>
      {open ? (
        <section className="fixed bottom-24 right-5 z-[90] w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
          <header className="flex items-center justify-between border-b border-line bg-[#f6f1e8] px-4 py-3">
            <div>
              <h3 className="m-0 text-sm font-semibold">Hỗ trợ nhanh</h3>
              <p className="m-0 text-xs text-muted">Khung chat RentWear</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-link text-sm"
            >
              Đóng
            </button>
          </header>

          <div className="max-h-72 space-y-2 overflow-y-auto px-3 py-3 text-sm">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-xl px-3 py-2 ${
                  message.sender === "user"
                    ? "ml-8 bg-brand text-white"
                    : "mr-8 bg-[#f2eadc] text-ink"
                }`}
              >
                {message.content}
              </div>
            ))}
          </div>

          <div className="border-t border-line px-3 py-3">
            <p className="mb-2 mt-0 text-xs text-muted">{hint}</p>
            <textarea
              className="input !mb-2 !mt-0 min-h-[72px]"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Nhập nội dung bạn cần hỗ trợ..."
            />
            <button type="button" className="btn-primary w-full" onClick={handleSend}>
              Gửi tin nhắn
            </button>
          </div>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="fixed bottom-6 right-5 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg transition hover:scale-105 hover:bg-brand-hover"
        aria-label="Mở khung chat"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-6 w-6"
        >
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
        </svg>
      </button>
    </>
  );
}
