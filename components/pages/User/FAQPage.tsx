import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BluetoothIcon,
  RemoteControlIcon,
  Home01Icon,
  UserCircleIcon,
  ArrowDown01Icon,
  Search01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";

// ============================================================================
// Types
// ============================================================================

type HugeIcon = React.ComponentProps<typeof HugeiconsIcon>["icon"];

type FAQBlock =
  | { type: "paragraph"; heading?: string; text: string }
  | { type: "signs"; text: string }
  | { type: "causes"; items: string[] }
  | { type: "steps"; heading?: string; items: string[] }
  | { type: "flow"; steps: string[] }
  | { type: "warning"; text: string }
  | { type: "tip"; text: string }
  | { type: "note"; heading?: string; items: string[] }
  | { type: "image"; src: string; caption: string };

type FAQItem = {
  id: string;
  question: string;
  blocks: FAQBlock[];
};

type FAQGroup = {
  id: string;
  title: string;
  description: string;
  icon: HugeIcon;
  items: FAQItem[];
};

// ============================================================================
// Helpers
// ============================================================================

function countItems(groups: FAQGroup[]): number {
  return groups.reduce((total, group) => total + group.items.length, 0);
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function blockToSearchableText(block: FAQBlock): string {
  switch (block.type) {
    case "paragraph":
      return `${block.heading ?? ""} ${block.text}`;
    case "signs":
    case "warning":
    case "tip":
      return block.text;
    case "causes":
      return block.items.join(" ");
    case "steps":
      return `${block.heading ?? ""} ${block.items.join(" ")}`;
    case "note":
      return `${block.heading ?? ""} ${block.items.join(" ")}`;
    case "flow":
      return block.steps.join(" ");
    case "image":
      return block.caption;
    default:
      return "";
  }
}

function searchFAQGroups(groups: FAQGroup[], query: string): FAQGroup[] {
  const q = normalize(query.trim());
  if (!q) return groups;
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const haystack = normalize(
          [item.question, ...item.blocks.map(blockToSearchableText)].join(" ")
        );
        return haystack.includes(q);
      }),
    }))
    .filter((group) => group.items.length > 0);
}

function buildItemKey(groupId: string, itemId: string): string {
  return `${groupId}::${itemId}`;
}

// ============================================================================
// Block-level UI components (đều nằm trong file này, không tách file riêng)
// ============================================================================

function SignsBlock({ text }: { text: string }) {
  return (
    <p className="text-[14px] leading-7 text-neutral-700">
      <span className="font-semibold text-primary underline decoration-primary underline-offset-4">
        Dấu hiệu:
      </span>{" "}
      {text}
    </p>
  );
}

function CausesBlock({ items }: { items: string[] }) {
  return (
    <div className="space-y-2">
      <p className="font-semibold text-base text-neutral-900">
        Nguyên nhân có thể
      </p>
      <ul className="space-y-1.5">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex gap-2 text-[14px] leading-7 text-neutral-700"
          >
            <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepsBlock({ heading, items }: { heading?: string; items: string[] }) {
  return (
    <div className="space-y-2">
      <p className="font-semibold text-base text-neutral-900">
        {heading ?? "Cách khắc phục"}
      </p>
      <ol className="space-y-2.5">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex gap-3 text-[14px] leading-7 text-neutral-700"
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-white">
              {index + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function FlowBlock({ steps }: { steps: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
      {steps.map((step, index) => (
        <span key={index} className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-neutral-800">
            {step}
          </span>
          {index < steps.length - 1 && (
            <span className="text-neutral-400">→</span>
          )}
        </span>
      ))}
    </div>
  );
}

function WarningBlock({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-[14px] leading-7 text-amber-900">
        <span className="mr-1.5">⚠️</span>
        <span className="font-semibold">Lưu ý:</span> {text}
      </p>
    </div>
  );
}

function TipBlock({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
      <p className="text-[14px] leading-7 text-neutral-800">
        <span className="mr-1.5">💡</span>
        <span className="font-semibold">Mẹo:</span> {text}
      </p>
    </div>
  );
}

function NoteBlock({ heading, items }: { heading?: string; items: string[] }) {
  return (
    <div className="space-y-2">
      {heading && (
        <p className="font-semibold text-base text-neutral-900">{heading}</p>
      )}
      <ul className="space-y-1.5">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex gap-2 text-[14px] leading-7 text-neutral-700"
          >
            <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-300" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ImageBlock({ src, caption }: { src: string; caption: string }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-neutral-200">
      <div className="flex items-center justify-center bg-neutral-100 py-10">
        <img src={src} alt={caption} className="max-h-56 w-auto object-contain" />
      </div>
      <figcaption className="border-t border-neutral-200 bg-white px-4 py-2 text-[13px] text-neutral-500">
        {caption}
      </figcaption>
    </figure>
  );
}

function ParagraphBlock({ heading, text }: { heading?: string; text: string }) {
  return (
    <div className="space-y-1.5">
      {heading && (
        <p className="font-semibold text-base text-neutral-900">{heading}</p>
      )}
      <p className="text-[14px] leading-7 text-neutral-700">{text}</p>
    </div>
  );
}

function renderFAQBlock(block: FAQBlock, key: string) {
  switch (block.type) {
    case "signs":
      return <SignsBlock key={key} text={block.text} />;
    case "causes":
      return <CausesBlock key={key} items={block.items} />;
    case "steps":
      return <StepsBlock key={key} heading={block.heading} items={block.items} />;
    case "flow":
      return <FlowBlock key={key} steps={block.steps} />;
    case "warning":
      return <WarningBlock key={key} text={block.text} />;
    case "tip":
      return <TipBlock key={key} text={block.text} />;
    case "note":
      return <NoteBlock key={key} heading={block.heading} items={block.items} />;
    case "image":
      return <ImageBlock key={key} src={block.src} caption={block.caption} />;
    case "paragraph":
    default:
      return (
        <ParagraphBlock
          key={key}
          heading={"heading" in block ? block.heading : undefined}
          text={block.text}
        />
      );
  }
}

// ============================================================================
// FAQ data
// ============================================================================

const FAQ_GROUPS: FAQGroup[] = [
  {
    id: "hub-connection",
    title: "Kết nối Hub",
    description:
      "Các vấn đề thường gặp khi thêm Hub và kết nối Hub với mạng WiFi.",
    icon: BluetoothIcon,
    items: [
      {
        id: "hc-01",
        question: "Không tìm thấy Hub",
        blocks: [
          {
            type: "signs",
            text: "Ứng dụng không tìm thấy Hub sau khi quét QR.",
          },
          {
            type: "causes",
            items: [
              "Hub chưa cắm điện.",
              "Hub chưa lên đèn.",
              "Bluetooth chưa bật.",
              "Chưa cấp quyền Bluetooth.",
              "Điện thoại ở quá xa.",
              "Hub đã được thêm bởi tài khoản khác.",
            ],
          },
          {
            type: "steps",
            items: [
              "Kiểm tra nguồn điện.",
              "Kiểm tra Hub đã sáng đèn.",
              "Bật Bluetooth.",
              "Kiểm tra quyền Bluetooth.",
              "Đưa điện thoại lại gần Hub.",
              "Nếu vẫn không được hãy nhấn nút trên Hub 8 lần liên tiếp để Reset.",
              "Sau đó tiến hành tạo phòng lại.",
            ],
          },
          {
            type: "image",
            src: "/h1.png",
            caption: "Hình 1. Hub kích hoạt thành công.",
          },
          {
            type: "image",
            src: "/push.jpg",
            caption: "Hình 2. Cách reset Hub.",
          },
          {
            type: "tip",
            text: "Reset sẽ xoá sạch mọi dữ liệu và đưa Hub về trạng thái ban đầu.",
          },
        ],
      },
      {
        id: "hc-02",
        question: "Hub hiển thị Offline",
        blocks: [
          {
            type: "signs",
            text: "Hub hiện Offline. Không điều khiển được thiết bị.",
          },
          {
            type: "causes",
            items: ["Mất điện.", "Mất WiFi.", "Ứng dụng chưa cập nhật trạng thái."],
          },
          {
            type: "note",
            heading: "Thông tin",
            items: [
              "Hub ưu tiên kết nối WiFi.",
              "Nếu mất WiFi, Hub sẽ chuyển sang Bluetooth.",
              "Bluetooth chỉ hoạt động khi điện thoại ở gần Hub.",
            ],
          },
          {
            type: "steps",
            items: [
              "Nhấn nút Refresh.",
              "Chờ vài giây.",
              "Nếu vẫn Offline hãy kiểm tra điện.",
              "Kiểm tra WiFi.",
            ],
          },
        ],
      },
      {
        id: "hc-03",
        question: "Không kết nối được WiFi",
        blocks: [
          {
            type: "causes",
            items: [
              "Sai tên WiFi.",
              "Sai mật khẩu WiFi.",
              "WiFi không đủ mạnh tới vị trí đặt Hub.",
            ],
          },
          {
            type: "warning",
            text: "Nếu bạn đổi vị trí Hub sang nơi WiFi cũ không phủ sóng, bạn phải Reset Hub rồi Add lại.",
          },
        ],
      },
      {
        id: "hc-04",
        question: "Hub liên tục mất kết nối",
        blocks: [
          {
            type: "causes",
            items: ["WiFi yếu.", "Hub đặt quá xa Router."],
          },
          {
            type: "steps",
            items: ["Đặt Hub gần Router hơn."],
          },
        ],
      },
    ],
  },
  {
    id: "device-control",
    title: "Điều khiển thiết bị",
    description:
      "Các vấn đề khi điều khiển máy lạnh, TV và thiết bị hồng ngoại.",
    icon: RemoteControlIcon,
    items: [
      {
        id: "dc-01",
        question: "Máy lạnh không phản hồi",
        blocks: [
          {
            type: "causes",
            items: ["Hub bị che khuất.", "Hub đặt quá xa.", "Chọn sai hãng máy lạnh."],
          },
          {
            type: "steps",
            items: [
              "Kiểm tra lại vị trí đặt Hub, đảm bảo không bị che khuất.",
              "Chọn đúng hãng máy lạnh trong danh sách.",
              'Nếu vẫn không được, dùng chức năng "Học lệnh".',
            ],
          },
          {
            type: "steps",
            heading: 'Hướng dẫn "Học lệnh"',
            items: [
              "Chọn Học lệnh.",
              "Chọn nút cần học trên giao diện ứng dụng.",
              "Hướng Remote thật vào Hub.",
              "Nhấn nút tương ứng trên Remote thật.",
              "Khi ứng dụng báo học thành công là hoàn tất.",
            ],
          },
          {
            type: "image",
            src: "/faq/hub-learning-remote.png",
            caption: "Hình 1. Hướng Remote vào Hub khi học lệnh.",
          },
        ],
      },
      {
        id: "dc-02",
        question: "TV và các thiết bị khác không phản hồi",
        blocks: [
          {
            type: "paragraph",
            text: 'Khác với máy lạnh, TV luôn cần được "Học lệnh" trước khi điều khiển được qua Hub, vì mỗi mẫu Remote TV phát tín hiệu hồng ngoại khác nhau.',
          },
          {
            type: "steps",
            heading: 'Hướng dẫn "Học lệnh" cho TV',
            items: [
              "Chọn Học lệnh.",
              "Chọn nút cần học trên giao diện ứng dụng.",
              "Hướng Remote thật vào Hub.",
              "Nhấn nút tương ứng trên Remote thật.",
              "Khi ứng dụng báo học thành công là hoàn tất.",
            ],
          },
          {
            type: "tip",
            text: "Quy trình học lệnh cho TV giống hệt máy lạnh, bạn có thể áp dụng lại các bước đã quen thuộc.",
          },
        ],
      },
      {
        id: "dc-03",
        question: "Điều khiển chậm",
        blocks: [
          {
            type: "causes",
            items: [
              "Đường truyền Internet yếu.",
              "Điều khiển sai thiết bị.",
              "Lệnh học bị double (trùng lệnh).",
            ],
          },
          {
            type: "tip",
            text: "Nên xóa thiết bị rồi học lại lệnh để đảm bảo tín hiệu chính xác.",
          },
        ],
      },
      {
        id: "dc-04",
        question: "Hub không phát tín hiệu IR",
        blocks: [
          {
            type: "paragraph",
            text: "Hub chỉ phát tín hiệu hồng ngoại (IR) khi bạn nhấn nút điều khiển trong ứng dụng. Hiện tại Hub chưa hỗ trợ chế độ kiểm tra (test) tín hiệu độc lập.",
          },
          {
            type: "warning",
            text: "Nếu đèn IR trên Hub không sáng khi bạn nhấn nút điều khiển, hãy kiểm tra lại hướng đặt Hub và khoảng cách tới thiết bị.",
          },
        ],
      },
    ],
  },
  {
    id: "room-management",
    title: "Quản lý phòng",
    description: "Tạo và quản lý phòng.",
    icon: Home01Icon,
    items: [
      {
        id: "rm-01",
        question: "Làm thế nào để tạo phòng",
        blocks: [
          {
            type: "steps",
            heading: "Các bước tạo phòng",
            items: [
              "Cắm điện cho Hub.",
              "Mở ứng dụng.",
              "Chọn Tạo phòng.",
              "Quét mã QR ở đáy Hub.",
              "Nhập thông tin WiFi.",
              "Hoàn tất.",
            ],
          },
        ],
      },
      {
        id: "rm-02",
        question: "Làm thế nào để xóa phòng",
        
        blocks: [
            {
            type: "causes",
            items: ["Nhấn nút thùng rác màu đỏ ở góc phải của thẻ phòng."],
          },
          {
            type: "warning",
            text: "Xóa phòng sẽ xóa luôn Hub gắn với phòng đó.",
          },
          {
            type: "tip",
            text: "Muốn dùng lại Hub, bạn phải Reset Hub rồi Add lại từ đầu.",
          },
        ],
      },
      {
        id: "rm-03",
        question: "Phòng không hiển thị",
        blocks: [
          {
            type: "causes",
            items: ["Tài khoản chưa đồng bộ."],
          },
          {
            type: "steps",
            items: ["Nhấn nút đồng bộ."],
          },
        ],
      },
    ],
  },
  {
    id: "account",
    title: "Tài khoản",
    description: "Đăng nhập và quản lý mật khẩu.",
    icon: UserCircleIcon,
    items: [
      {
        id: "acc-01",
        question: "Đổi mật khẩu",
        blocks: [
          {
            type: "flow",
            steps: [
              "Settings",
              "Đổi mật khẩu",
              "Nhập mật khẩu mới",
              "Xác nhận",
              "OTP",
              "Hoàn tất",
            ],
          },
          {
            type: "warning",
            text: "Mật khẩu mới không được trùng với mật khẩu cũ.",
          },
        ],
      },
      {
        id: "acc-02",
        question: "Quên mật khẩu",
        blocks: [
          {
            type: "flow",
            steps: [
              "Đăng nhập",
              "Quên mật khẩu",
              "Nhập Email",
              "OTP",
              "Mật khẩu mới",
            ],
          },
          {
            type: "note",
            heading: "Nếu không nhận được OTP",
            items: [
              "Kiểm tra lại địa chỉ Email.",
              "Kiểm tra thư mục Spam.",
              "Gửi lại OTP.",
            ],
          },
        ],
      },
    ],
  },
];
const QUICK_CATEGORIES: { id: string; label: string }[] = [
  { id: "hub-connection", label: "Bluetooth" },
  { id: "device-control", label: "Điều khiển" },
  { id: "room-management", label: "Phòng" },
  { id: "account", label: "Tài khoản" },
];
export default function FAQPage() {
  const [query, setQuery] = useState("");
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
  const [contactOpen, setContactOpen] = useState(false);
const [contactMessage, setContactMessage] = useState("");
const [contactSubmitted, setContactSubmitted] = useState(false);

  const filteredGroups = useMemo(
    () => searchFAQGroups(FAQ_GROUPS, query),
    [query]
  );

  const totalQuestions = useMemo(() => countItems(FAQ_GROUPS), []);
  const hasResults = filteredGroups.length > 0;
  const isSearching = query.trim().length > 0;

  function toggleItem(key: string) {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function clearSearch() {
    setQuery("");
  }
  function scrollToGroup(groupId: string) {
  if (query.trim().length > 0) setQuery("");
  requestAnimationFrame(() => {
    document
      .getElementById(groupId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function submitContact() {
  if (!contactMessage.trim()) return;
  // TODO: gọi API gửi liên hệ ở đây, ví dụ fetch("/api/contact", {...})
  setContactSubmitted(true);
}

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full px-4 py-6">
        {/* Header */}
        

          {/* Search */}
          <div className="mx-auto mt-8 max-w-lg">
            <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 transition-colors focus-within:border-primary/40 focus-within:bg-white">
              <span className="shrink-0 text-neutral-400">
                <HugeiconsIcon
                  icon={Search01Icon}
                  size={18}
                  strokeWidth={1.8}
                  color="currentColor"
                />
              </span>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm kiếm câu hỏi..."
                className="w-full bg-transparent text-[14px] text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
              />
              {isSearching && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Xóa tìm kiếm"
                  className="shrink-0 rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-700"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={14}
                    strokeWidth={2}
                    color="currentColor"
                  />
                </button>
              )}
            </div>
            {!isSearching && (
              <p className="mt-3 text-[13px] text-neutral-400">
                {totalQuestions} câu hỏi trong {FAQ_GROUPS.length} nhóm
              </p>
            )}
            <div className="mt-5 m-6 flex flex-wrap justify-center gap-2">
            {QUICK_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => scrollToGroup(category.id)}
                className="rounded-full bg-neutral-100 px-4 py-1.5 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-primary/10 hover:text-primary"
              >
                {category.label}
              </button>
            ))}
          </div>
          </div>

        {/* Groups */}
        {hasResults ? (
          <div className="space-y-6">
            {filteredGroups.map((group) => (
              <div
                    key={group.id}
                    id={group.id}
                    className="scroll-mt-6 border-b border-neutral-100 pb-8 last:border-b-0"
                    >
                    <div className="py-8 first:pt-0">
                  {/* Group header */}
                  <div className="mb-6 flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <HugeiconsIcon
                        icon={group.icon}
                        size={22}
                        strokeWidth={1.8}
                        color="currentColor"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-neutral-900">
                          {group.title}
                        </h2>
                        <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[12px] font-medium text-neutral-500">
                          {group.items.length} câu hỏi
                        </span>
                      </div>
                      <p className="mt-1 text-[14px] leading-6 text-neutral-500">
                        {group.description}
                      </p>
                    </div>
                  </div>

                  {/* Accordion items */}
                  <div className="divide-y divide-neutral-100 border-t border-neutral-100">
                    {group.items.map((item) => {
                      const key = buildItemKey(group.id, item.id);
                      const isOpen = openKeys.has(key);
                      return (
                        <div key={item.id} className="py-1">
                          <button
                            type="button"
                            onClick={() => toggleItem(key)}
                            aria-expanded={isOpen}
                            className={`flex w-full items-center justify-between gap-4 rounded-xl px-2 py-4 text-left transition-colors ${
                              isOpen ? "bg-neutral-50" : "hover:bg-neutral-50"
                            }`}
                          >
                            <span className="text-[15px] font-medium text-neutral-900">
                              {item.question}
                            </span>
                            <span
                              className={`inline-flex shrink-0 text-neutral-400 transition-transform duration-300 ease-out ${
                                isOpen ? "rotate-180" : "rotate-0"
                              }`}
                            >
                              <HugeiconsIcon
                                icon={ArrowDown01Icon}
                                size={18}
                                strokeWidth={2}
                                color="currentColor"
                              />
                            </span>
                          </button>

                          <div
                            className={`grid overflow-hidden transition-all duration-300 ease-out ${
                              isOpen
                                ? "grid-rows-[1fr] opacity-100"
                                : "grid-rows-[0fr] opacity-0"
                            }`}
                          >
                            <div className="min-h-0">
                              <div className="space-y-4 rounded-xl bg-neutral-50 px-4 py-5 sm:px-5">
                                {item.blocks.map((block, index) =>
                                  renderFAQBlock(block, `${key}-${index}`)
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  </div>
                  </div>
                
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-4xl">😥</p>
            <p className="mt-3 text-[15px] font-medium text-neutral-700">
              Không tìm thấy câu hỏi phù hợp.
            </p>
            <p className="mt-1 text-[14px] text-neutral-400">
              Hãy thử từ khóa khác.
            </p>
            <button
              type="button"
              onClick={clearSearch}
              className="mt-5 rounded-full border border-neutral-200 px-4 py-2 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
            >
              Xóa tìm kiếm
            </button>
          </div>
        )}

        {/* Bạn cần hỗ trợ? */}
        <div className="mt-10 rounded-3xl bg-neutral-50 p-6 text-center sm:p-8">
          {contactSubmitted ? (
            <div>
              <p className="text-[15px] font-medium text-neutral-900">
                Đã gửi yêu cầu của bạn.
              </p>
              <p className="mt-1 text-[14px] text-neutral-500">
                Chúng tôi sẽ liên hệ lại với bạn sớm nhất có thể.
              </p>
            </div>
          ) : contactOpen ? (
            <div className="mx-auto max-w-md text-left">
              <p className="text-[15px] font-medium text-neutral-900">
                Mô tả vấn đề của bạn
              </p>
              <textarea
                value={contactMessage}
                onChange={(event) => setContactMessage(event.target.value)}
                placeholder="Nhập vấn đề bạn đang gặp phải..."
                rows={4}
                className="mt-3 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-[14px] text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-primary/40"
              />
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setContactOpen(false);
                    setContactMessage("");
                  }}
                  className="rounded-full px-4 py-2 text-[13px] font-medium text-neutral-500 hover:bg-neutral-100"
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  onClick={submitContact}
                  disabled={!contactMessage.trim()}
                  className="rounded-full bg-primary px-5 py-2 text-[13px] font-medium text-white transition-opacity disabled:opacity-40"
                >
                  Gửi
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[15px] font-medium text-neutral-900">
                Không tìm thấy câu trả lời?
              </p>
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="mt-3 rounded-full bg-primary px-5 py-2 text-[13px] font-medium text-white"
              >
                Liên hệ chúng tôi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}