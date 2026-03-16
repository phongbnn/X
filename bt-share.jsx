import { useState, useRef, useEffect } from "react";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#04060f;}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes ripple{0%{transform:scale(.5);opacity:.7}100%{transform:scale(3);opacity:0}}
@keyframes pop{0%{transform:scale(0);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.15}}
@keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
@keyframes glow{0%,100%{box-shadow:0 0 12px #00ffe044}50%{box-shadow:0 0 28px #00ffe099}}
@keyframes spin{to{transform:rotate(360deg)}}
input::placeholder{color:#1e2a44}
button:active{transform:scale(.97)!important}
`;

const genCode = () => Math.floor(100000 + Math.random() * 900000).toString();
const SKEY = (c) => `btshare-${c}`;

export default function App() {
  const [screen, setScreen] = useState("setup");
  const [myName, setMyName] = useState("");
  const [nameErr, setNameErr] = useState("");
  const [btDevice, setBtDevice] = useState(null);
  const [btErr, setBtErr] = useState("");
  const [btLoading, setBtLoading] = useState(false);
  const [code, setCode] = useState("");
  const [inp, setInp] = useState("");
  const [inpErr, setInpErr] = useState("");
  const [sess, setSess] = useState(null);
  const [reqInfo, setReqInfo] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  const scanBluetooth = async () => {
    setBtErr(""); setBtLoading(true); setBtDevice(null);
    if (!navigator.bluetooth) {
      setBtErr("Trình duyệt không hỗ trợ Bluetooth. Dùng Chrome trên Android hoặc Desktop.");
      setBtLoading(false); return;
    }
    try {
      const dev = await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
      setBtDevice(dev);
      const c = genCode(); setCode(c);
      const data = {
        code: c,
        owner: myName,
        keyboard: dev.name || dev.id || "Bluetooth Device",
        status: "waiting",
        requester: null,
        ts: Date.now()
      };
      setSess(data);
      try { await window.storage.set(SKEY(c), JSON.stringify(data), true); } catch {}
      setScreen("code");
      pollRef.current = setInterval(async () => {
        try {
          const r = await window.storage.get(SKEY(c), true);
          if (r) {
            const d = JSON.parse(r.value);
            if (d.status === "requested") {
              clearInterval(pollRef.current);
              setReqInfo(d);
              setScreen("approve");
            }
          }
        } catch {}
      }, 1500);
    } catch (e) {
      if (e.name !== "NotFoundError" && e.name !== "AbortError") {
        setBtErr("Không thể kết nối Bluetooth. Kiểm tra lại quyền truy cập.");
      }
      // user cancelled or no device → show nothing
    } finally { setBtLoading(false); }
  };

  const approve = async (yes) => {
    const upd = { ...reqInfo, status: yes ? "approved" : "denied" };
    try { await window.storage.set(SKEY(upd.code), JSON.stringify(upd), true); } catch {}
    setScreen(yes ? "owner_ok" : "home");
  };

  const submitCode = async () => {
    const c = inp.trim();
    if (c.length !== 6) { setInpErr("Nhập đủ 6 chữ số"); return; }
    setInpErr(""); setScreen("waiting");
    try {
      const r = await window.storage.get(SKEY(c), true);
      if (!r) { setInpErr("Mã không đúng hoặc hết hạn"); setScreen("enter"); return; }
      const d = JSON.parse(r.value);
      if (d.status !== "waiting") { setInpErr("Mã này đã được dùng rồi"); setScreen("enter"); return; }
      const upd = { ...d, status: "requested", requester: myName };
      await window.storage.set(SKEY(c), JSON.stringify(upd), true);
      setSess(upd);
      pollRef.current = setInterval(async () => {
        try {
          const r2 = await window.storage.get(SKEY(c), true);
          if (r2) {
            const d2 = JSON.parse(r2.value);
            if (d2.status === "approved") {
              clearInterval(pollRef.current); setSess(d2); setScreen("done");
            } else if (d2.status === "denied") {
              clearInterval(pollRef.current); setInpErr("Yêu cầu bị từ chối"); setScreen("enter");
            }
          }
        } catch {}
      }, 1500);
    } catch { setInpErr("Lỗi kết nối, thử lại"); setScreen("enter"); }
  };

  const wrap = {
    minHeight: "100vh", background: "#04060f",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20, fontFamily: "Syne, sans-serif"
  };

  return (
    <>
      <style>{CSS}</style>
      <div style={wrap}>
        {/* grid bg */}
        <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(#0af2,transparent 1px),linear-gradient(90deg,#0af1,transparent 1px)", backgroundSize: "60px 60px", backgroundPosition: "center", opacity: .07, pointerEvents: "none" }} />

        <div style={{ width: "100%", maxWidth: 400, position: "relative" }}>

          {/* ═══ SETUP ═══ */}
          {screen === "setup" && (
            <div style={{ animation: "fadeUp .5s ease" }}>
              <div style={{ textAlign: "center", marginBottom: 40 }}>
                <div style={{ width: 70, height: 70, borderRadius: 20, background: "linear-gradient(135deg,#001a33,#002244)", border: "1.5px solid #00ffe033", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 20px", animation: "glow 3s ease infinite" }}>⌨️</div>
                <h1 style={{ fontSize: 30, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>BT<span style={{ color: "#00ffe0" }}>Share</span></h1>
                <p style={{ color: "#1e3050", fontSize: 13, marginTop: 6, fontFamily: "JetBrains Mono" }}>Chia sẻ bàn phím Bluetooth</p>
              </div>

              <div style={{ background: "#080d1a", border: "1px solid #0d1f3c", borderRadius: 16, padding: "20px 18px", marginBottom: 12 }}>
                <label style={{ color: "#1e3a5c", fontSize: 11, fontFamily: "JetBrains Mono", letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Tên thiết bị của bạn</label>
                <input
                  value={myName}
                  onChange={e => { setMyName(e.target.value); setNameErr(""); }}
                  placeholder="VD: Samsung S24 của Nam"
                  style={{ width: "100%", background: "#040810", border: "1px solid #0d1f3c", borderRadius: 10, padding: "13px 14px", color: "#c8e0ff", fontFamily: "JetBrains Mono", fontSize: 14, outline: "none", transition: "border .2s" }}
                  onFocus={e => e.target.style.border = "1px solid #00ffe060"}
                  onBlur={e => e.target.style.border = "1px solid #0d1f3c"}
                />
                {nameErr && <p style={{ color: "#ff4466", fontSize: 12, marginTop: 6, fontFamily: "JetBrains Mono" }}>{nameErr}</p>}
              </div>

              <GlowBtn color="#00ffe0" onClick={() => {
                if (!myName.trim()) setNameErr("Nhập tên thiết bị trước");
                else setScreen("home");
              }}>
                Bắt đầu →
              </GlowBtn>
            </div>
          )}

          {/* ═══ HOME ═══ */}
          {screen === "home" && (
            <div style={{ animation: "fadeUp .4s ease" }}>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "#080d1a", border: "1px solid #0d1f3c", borderRadius: 30, marginBottom: 20 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#00ffe0", boxShadow: "0 0 8px #00ffe0", display: "inline-block", animation: "blink 2s infinite" }} />
                  <span style={{ color: "#5080a0", fontSize: 12, fontFamily: "JetBrains Mono" }}>{myName}</span>
                </div>
                <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 800 }}>Chọn chức năng</h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <ActionCard
                  icon="📡" title="Tạo mã chia sẻ"
                  sub="Bluetooth bật → Chọn thiết bị → Nhận mã 6 số"
                  color="#00ffe0"
                  onClick={() => { setBtDevice(null); setBtErr(""); setScreen("bt"); }}
                />
                <ActionCard
                  icon="🔑" title="Nhập mã kết nối"
                  sub="Nhập mã từ điện thoại kia để xin quyền dùng bàn phím"
                  color="#7c6fff"
                  onClick={() => { setInp(""); setInpErr(""); setScreen("enter"); }}
                />
              </div>
            </div>
          )}

          {/* ═══ BT SCAN ═══ */}
          {screen === "bt" && (
            <div style={{ animation: "fadeUp .4s ease" }}>
              <BackBtn onClick={() => setScreen("home")} />
              <div style={{ textAlign: "center", padding: "20px 0 28px" }}>
                <div style={{ position: "relative", width: 90, height: 90, margin: "0 auto 24px" }}>
                  {btLoading && [0,1,2].map(i => (
                    <div key={i} style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1.5px solid #00ffe0", animation: `ripple 2s ease-out ${i * .6}s infinite` }} />
                  ))}
                  <div style={{ position: "absolute", inset: "50%", transform: "translate(-50%,-50%)", width: 54, height: 54, borderRadius: "50%", background: btLoading ? "rgba(0,255,224,0.1)" : "#080d1a", border: `2px solid ${btLoading ? "#00ffe0" : "#0d1f3c"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, transition: "all .3s" }}>
                    {btLoading ? <span style={{ animation: "blink 1s infinite" }}>🔵</span> : "📶"}
                  </div>
                </div>

                {!btLoading && (
                  <>
                    <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Kết nối bàn phím</h2>
                    <p style={{ color: "#1e3050", fontSize: 13, lineHeight: 1.6, marginBottom: 16, fontFamily: "JetBrains Mono" }}>
                      Bấm nút bên dưới để bật Bluetooth<br />và chọn bàn phím gần bạn
                    </p>
                    {btErr && (
                      <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(255,50,80,.07)", border: "1px solid rgba(255,50,80,.25)", borderRadius: 10, color: "#ff6680", fontSize: 12, fontFamily: "JetBrains Mono", lineHeight: 1.6 }}>
                        ⚠️ {btErr}
                      </div>
                    )}
                    <GlowBtn color="#00ffe0" onClick={scanBluetooth}>
                      🔵 Bật Bluetooth &amp; Chọn thiết bị
                    </GlowBtn>
                    <p style={{ color: "#0d1f3c", fontSize: 11, marginTop: 12, fontFamily: "JetBrains Mono" }}>
                      Trình duyệt sẽ hiện danh sách thiết bị thật · Chỉ thiết bị kết nối được mới hiện
                    </p>
                  </>
                )}

                {btLoading && (
                  <>
                    <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Đang mở Bluetooth...</h2>
                    <p style={{ color: "#1e3050", fontSize: 13, fontFamily: "JetBrains Mono" }}>Chọn bàn phím trong popup của trình duyệt</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ═══ CODE ═══ */}
          {screen === "code" && (
            <div style={{ animation: "fadeUp .4s ease" }}>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <p style={{ color: "#00ffe060", fontSize: 10, fontFamily: "JetBrains Mono", letterSpacing: 4, marginBottom: 10 }}>MÃ GHÉP NỐI</p>
                <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 800 }}>Gửi mã này cho ĐT kia</h2>
                <p style={{ color: "#1e3050", fontSize: 12, marginTop: 6, fontFamily: "JetBrains Mono" }}>
                  ⌨️ {btDevice?.name || btDevice?.id || "Bàn phím Bluetooth"}
                </p>
              </div>

              <div style={{ background: "#080d1a", border: "1px solid #0d2a1a", borderRadius: 16, padding: "24px 18px", textAlign: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 7, justifyContent: "center", marginBottom: 20 }}>
                  {code.split("").map((d, i) => (
                    <div key={i} style={{ width: 46, height: 58, display: "flex", alignItems: "center", justifyContent: "center", background: "#040e08", border: "1px solid #00ffe030", borderRadius: 10, fontFamily: "JetBrains Mono", fontSize: 26, fontWeight: 600, color: "#00ffe0", animation: `slideUp .4s ease ${i * .08}s both`, boxShadow: "0 0 12px #00ffe015" }}>
                      {d}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ffe0", display: "inline-block", animation: "blink 1.2s infinite" }} />
                  <span style={{ color: "#1e4030", fontSize: 12, fontFamily: "JetBrains Mono" }}>Đang chờ thiết bị kia nhập mã...</span>
                </div>
              </div>

              <div style={{ padding: "11px 14px", background: "#08100a", border: "1px solid #0a2515", borderRadius: 10, color: "#1a4a25", fontSize: 12, fontFamily: "JetBrains Mono", lineHeight: 1.65 }}>
                💡 ĐT2 mở app → "Nhập mã kết nối" → nhập <b style={{ color: "#00ffe060" }}>{code}</b>
              </div>
            </div>
          )}

          {/* ═══ APPROVE ═══ */}
          {screen === "approve" && (
            <div style={{ animation: "pop .4s ease" }}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ width: 68, height: 68, borderRadius: "50%", background: "rgba(124,111,255,.1)", border: "2px solid rgba(124,111,255,.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px" }}>🔔</div>
                <p style={{ color: "#7c6fff80", fontSize: 10, fontFamily: "JetBrains Mono", letterSpacing: 4, marginBottom: 8 }}>YÊU CẦU MỚI</p>
                <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 800 }}>Cho phép kết nối?</h2>
              </div>

              <div style={{ background: "#080d1a", border: "1px solid #0d1f3c", borderRadius: 14, padding: "16px", marginBottom: 14 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(124,111,255,.1)", border: "1px solid rgba(124,111,255,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>📱</div>
                  <div>
                    <div style={{ color: "#c8e0ff", fontWeight: 700, fontSize: 15 }}>{reqInfo?.requester}</div>
                    <div style={{ color: "#1e3050", fontSize: 12, fontFamily: "JetBrains Mono" }}>muốn dùng bàn phím của bạn</div>
                  </div>
                </div>
                <div style={{ padding: "9px 12px", background: "#040810", borderRadius: 8, fontSize: 13, color: "#2a4060", fontFamily: "JetBrains Mono" }}>
                  ⌨️ {sess?.keyboard || btDevice?.name}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button onClick={() => approve(false)} style={{ padding: 14, borderRadius: 12, background: "rgba(255,50,80,.07)", border: "1px solid rgba(255,50,80,.25)", color: "#ff4466", fontFamily: "Syne", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                  Từ chối ✗
                </button>
                <button onClick={() => approve(true)} style={{ padding: 14, borderRadius: 12, background: "rgba(0,255,100,.07)", border: "1px solid rgba(0,255,100,.25)", color: "#00ff88", fontFamily: "Syne", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                  Đồng ý ✓
                </button>
              </div>
            </div>
          )}

          {/* ═══ OWNER OK ═══ */}
          {screen === "owner_ok" && (
            <div style={{ animation: "fadeUp .4s ease", textAlign: "center" }}>
              <div style={{ width: 78, height: 78, borderRadius: "50%", background: "rgba(0,255,136,.07)", border: "2px solid #00ff88", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 20px", animation: "pop .5s ease" }}>✓</div>
              <p style={{ color: "#00ff8880", fontSize: 10, fontFamily: "JetBrains Mono", letterSpacing: 4, marginBottom: 8 }}>ĐÃ CẤP QUYỀN</p>
              <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Thành công!</h2>
              <div style={{ background: "#080d1a", border: "1px solid #0d1f3c", borderRadius: 14, padding: "16px", textAlign: "left", marginBottom: 14 }}>
                <InfoRow label="Cấp cho" value={reqInfo?.requester} />
                <InfoRow label="Bàn phím" value={`⌨️ ${sess?.keyboard}`} />
                <InfoRow label="Trạng thái" value="🟢 Đang hoạt động" last />
              </div>
              <GlowBtn color="#00ffe0" onClick={() => setScreen("home")}>← Về trang chính</GlowBtn>
            </div>
          )}

          {/* ═══ ENTER CODE ═══ */}
          {screen === "enter" && (
            <div style={{ animation: "fadeUp .4s ease" }}>
              <BackBtn onClick={() => setScreen("home")} />
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <p style={{ color: "#7c6fff80", fontSize: 10, fontFamily: "JetBrains Mono", letterSpacing: 4, marginBottom: 10 }}>NHẬP MÃ</p>
                <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 800 }}>Kết nối bàn phím</h2>
                <p style={{ color: "#1e3050", fontSize: 12, marginTop: 6, fontFamily: "JetBrains Mono" }}>Nhập mã 6 số từ điện thoại kia</p>
              </div>
              <div style={{ background: "#080d1a", border: "1px solid #0d1f3c", borderRadius: 16, padding: "20px 16px", marginBottom: 12 }}>
                <input
                  value={inp}
                  onChange={e => { setInp(e.target.value.replace(/\D/g, "").slice(0, 6)); setInpErr(""); }}
                  maxLength={6} inputMode="numeric" autoFocus
                  placeholder="● ● ● ● ● ●"
                  style={{ width: "100%", background: "#040810", border: "1px solid #1a1f3c", borderRadius: 12, padding: "16px", color: "#a090ff", fontFamily: "JetBrains Mono", fontSize: 30, outline: "none", textAlign: "center", letterSpacing: 16, transition: "border .2s", caretColor: "#7c6fff" }}
                  onFocus={e => e.target.style.border = "1px solid #7c6fff80"}
                  onBlur={e => e.target.style.border = "1px solid #1a1f3c"}
                />
                {inpErr && <p style={{ color: "#ff4466", fontSize: 12, marginTop: 8, fontFamily: "JetBrains Mono", textAlign: "center" }}>{inpErr}</p>}
              </div>
              <GlowBtn color="#7c6fff" onClick={submitCode}>Xác nhận kết nối</GlowBtn>
            </div>
          )}

          {/* ═══ WAITING ═══ */}
          {screen === "waiting" && (
            <div style={{ animation: "fadeUp .4s ease", textAlign: "center" }}>
              <div style={{ position: "relative", width: 90, height: 90, margin: "0 auto 24px" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1.5px solid #7c6fff", animation: `ripple 2s ease-out ${i * .6}s infinite` }} />
                ))}
                <div style={{ position: "absolute", inset: "50%", transform: "translate(-50%,-50%)", width: 54, height: 54, borderRadius: "50%", background: "rgba(124,111,255,.1)", border: "2px solid #7c6fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                  <span style={{ animation: "blink 1.2s infinite" }}>📡</span>
                </div>
              </div>
              <p style={{ color: "#7c6fff80", fontSize: 10, fontFamily: "JetBrains Mono", letterSpacing: 4, marginBottom: 8 }}>ĐANG CHỜ</p>
              <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Yêu cầu đã gửi</h2>
              <p style={{ color: "#1e3050", fontSize: 13, fontFamily: "JetBrains Mono" }}>Chờ điện thoại kia xác nhận...</p>
              <div style={{ marginTop: 24, padding: "13px 18px", background: "#080d1a", border: "1px solid #1a1f3c", borderRadius: 12 }}>
                <p style={{ color: "#1a2540", fontSize: 11, fontFamily: "JetBrains Mono", marginBottom: 6 }}>Mã đã nhập</p>
                <p style={{ fontFamily: "JetBrains Mono", color: "#7c6fff", fontSize: 26, letterSpacing: 14 }}>{inp}</p>
              </div>
            </div>
          )}

          {/* ═══ DONE ═══ */}
          {screen === "done" && (
            <div style={{ animation: "fadeUp .4s ease", textAlign: "center" }}>
              <div style={{ width: 78, height: 78, borderRadius: "50%", background: "rgba(124,111,255,.1)", border: "2px solid #7c6fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 20px", animation: "pop .5s ease" }}>⌨️</div>
              <p style={{ color: "#7c6fff80", fontSize: 10, fontFamily: "JetBrains Mono", letterSpacing: 4, marginBottom: 8 }}>KẾT NỐI THÀNH CÔNG</p>
              <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Bàn phím sẵn sàng!</h2>
              <p style={{ color: "#1e3050", fontSize: 13, fontFamily: "JetBrains Mono", marginBottom: 22 }}>Bạn đã được cấp quyền sử dụng</p>
              <div style={{ background: "#080d1a", border: "1px solid #0d1f3c", borderRadius: 14, padding: "16px", textAlign: "left", marginBottom: 12 }}>
                <InfoRow label="Từ thiết bị" value={sess?.owner} />
                <InfoRow label="Bàn phím" value={`⌨️ ${sess?.keyboard}`} />
                <InfoRow label="Quyền" value="🟢 Đã kích hoạt" last />
              </div>
              <div style={{ padding: "11px 14px", background: "#040e08", border: "1px solid #0a2515", borderRadius: 10, color: "#1a4a25", fontSize: 12, fontFamily: "JetBrains Mono", lineHeight: 1.65, marginBottom: 12 }}>
                ✅ Bàn phím Bluetooth đã được kết nối với thiết bị của bạn
              </div>
              <GlowBtn color="#7c6fff" onClick={() => setScreen("home")}>← Về trang chính</GlowBtn>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

function GlowBtn({ children, onClick, color }) {
  const isGreen = color === "#00ffe0";
  return (
    <button
      onClick={onClick}
      style={{ width: "100%", padding: "15px", borderRadius: 13, background: isGreen ? "linear-gradient(135deg,#003322,#005544)" : "linear-gradient(135deg,#1a1040,#2d1a80)", border: `1px solid ${color}30`, color, fontFamily: "Syne", fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all .2s", boxShadow: `0 0 20px ${color}15`, letterSpacing: .5 }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 30px ${color}35`; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 0 20px ${color}15`; e.currentTarget.style.transform = "translateY(0)"; }}
    >{children}</button>
  );
}

function ActionCard({ icon, title, sub, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ background: "#080d1a", border: "1px solid #0d1f3c", borderRadius: 14, padding: "16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", textAlign: "left", transition: "all .2s", width: "100%" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color + "40"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#0d1f3c"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ width: 50, height: 50, borderRadius: 13, background: `${color}0d`, border: `1px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <p style={{ color: "#c8e0ff", fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{title}</p>
        <p style={{ color: "#1e3050", fontSize: 11, fontFamily: "JetBrains Mono", lineHeight: 1.5 }}>{sub}</p>
      </div>
      <span style={{ color, fontSize: 18, flexShrink: 0 }}>›</span>
    </button>
  );
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", color: "#1e3050", fontFamily: "JetBrains Mono", fontSize: 12, cursor: "pointer", marginBottom: 18, padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
      ← quay lại
    </button>
  );
}

function InfoRow({ label, value, last }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: last ? "none" : "1px solid #0d1f3c" }}>
      <span style={{ color: "#1e3050", fontSize: 12, fontFamily: "JetBrains Mono" }}>{label}</span>
      <span style={{ color: "#c8e0ff", fontSize: 13, fontWeight: 600 }}>{value}</span>
    </div>
  );
}
