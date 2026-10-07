"use client";

import { useEffect, useRef, useState } from "react";
import { ProductButton } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics";

type Detector = { detect(source: CanvasImageSource): Promise<Array<{ rawValue?: string }>> };
type DetectorWindow = Window & { BarcodeDetector?: new () => Detector };

export interface TicketScanResult {
  numbers: number[];
  round?: number;
}

function normalizeNumbers(values: unknown): number[] | null {
  if (!Array.isArray(values) || values.length !== 6) return null;
  const numbers = values.map(Number);
  if (numbers.some((number) => !Number.isInteger(number) || number < 1 || number > 45) || new Set(numbers).size !== 6) return null;
  return numbers.sort((left, right) => left - right);
}

function parseNumberList(value: string) {
  const tokens = value.trim().split(/\s*[,|/]\s*/);
  return tokens.length === 6 && tokens.every((token) => /^\d{1,2}$/.test(token)) ? normalizeNumbers(tokens) : null;
}

function parseRound(value: unknown) {
  const round = Number(value);
  return Number.isInteger(round) && round > 0 ? round : undefined;
}

export function parseTicketPayload(rawValue: string): TicketScanResult | null {
  const raw = rawValue.trim();
  if (!raw) return null;

  try {
    const payload = JSON.parse(raw) as { round?: unknown; ltEpsd?: unknown; numbers?: unknown; game?: { numbers?: unknown }; games?: Array<{ numbers?: unknown }> };
    const numbers = normalizeNumbers(payload.numbers ?? payload.game?.numbers ?? (payload.games?.length === 1 ? payload.games[0]?.numbers : undefined));
    if (numbers) return { numbers, round: parseRound(payload.round ?? payload.ltEpsd) };
  } catch {
    // QR payloads are often plain text; continue with the strict text formats below.
  }

  try {
    const url = new URL(raw);
    const numbers = parseNumberList(url.searchParams.get("numbers") ?? url.searchParams.get("nums") ?? url.searchParams.get("game") ?? "");
    if (numbers) return { numbers, round: parseRound(url.searchParams.get("round") ?? url.searchParams.get("ltEpsd")) };
  } catch {
    // The value is not a URL, so continue with plain text parsing.
  }

  const labeled = raw.match(/^(?:numbers?|game(?:\s*[a-e])?)\s*[:=]\s*(\d{1,2}(?:\s*[,|/]\s*\d{1,2}){5})$/i);
  const numbers = parseNumberList(labeled?.[1] ?? raw);
  return numbers ? { numbers } : null;
}

export function TicketScanner({ onNumbersDetected }: { onNumbersDetected: (result: TicketScanResult) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [captured, setCaptured] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => () => { streamRef.current?.getTracks().forEach((track) => track.stop()); }, []);

  useEffect(() => {
    if (!active || !streamRef.current || !videoRef.current) return;
    const video = videoRef.current;
    video.srcObject = streamRef.current;
    void video.play().catch(() => setError("카메라 화면을 재생하지 못했어요. 다시 시도해 주세요."));
    return () => { video.pause(); video.srcObject = null; };
  }, [active]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
    setActive(false);
  };

  const detectFromCanvas = async (canvas: HTMLCanvasElement, source: "camera" | "upload") => {
    const DetectorClass = (window as DetectorWindow).BarcodeDetector;
    if (!DetectorClass) {
      trackEvent("ticket_scan_failed", { source, reason: "barcode_detector_unsupported" });
      setMessage("이 브라우저에서는 QR 자동 인식을 지원하지 않아요. 사진을 참고해 번호를 직접 선택해 주세요.");
      return;
    }
    try {
      const detected = await new DetectorClass().detect(canvas);
      const candidates = detected.map((item) => parseTicketPayload(item.rawValue ?? "")).filter((item): item is TicketScanResult => item !== null);
      if (candidates.length === 1) {
        const result = candidates[0];
        onNumbersDetected(result);
        trackEvent("ticket_scan_detected", { source, detectedNumbers: result.numbers.length, detectedRound: result.round ?? "unknown" });
        setMessage(`번호 ${result.numbers.join(", ")}를 찾았어요. 회차와 번호를 확인한 뒤 결과를 확인해 주세요.`);
      } else {
        trackEvent("ticket_scan_failed", { source, reason: candidates.length > 1 ? "multiple_games_found" : "supported_payload_not_found" });
        setMessage("지원하는 QR 형식에서 한 게임 번호를 확인하지 못했어요. 사진을 참고해 번호를 직접 선택해 주세요.");
      }
    } catch {
      trackEvent("ticket_scan_failed", { source, reason: "detector_error" });
      setMessage("QR을 읽지 못했어요. 사진을 참고해 번호를 직접 선택해 주세요.");
    }
  };

  const capture = async () => {
    const video = videoRef.current;
    if (!video || !cameraReady || video.videoWidth === 0 || video.videoHeight === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setCaptured(canvas.toDataURL("image/jpeg", 0.86));
    setError("");
    stopCamera();
    trackEvent("ticket_scan_captured", { source: "camera" });
    await detectFromCanvas(canvas, "camera");
  };

  const startCamera = async () => {
    if (active || starting) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("이 브라우저에서는 카메라를 사용할 수 없어요. 사진 업로드나 번호 직접 선택을 이용해 주세요.");
      return;
    }
    setError("");
    setMessage("");
    setStarting(true);
    trackEvent("ticket_scan_started", { source: "camera" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      setActive(true);
    } catch {
      trackEvent("ticket_scan_failed", { source: "camera", reason: "permission_or_device" });
      setError("카메라 권한을 허용하지 않았거나 카메라를 찾을 수 없어요. 사진 업로드나 번호 직접 선택을 이용해 주세요.");
      stopCamera();
    } finally {
      setStarting(false);
    }
  };

  const uploadImage = async (file: File) => {
    trackEvent("ticket_scan_started", { source: "upload" });
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext("2d")?.drawImage(image, 0, 0);
      setCaptured(canvas.toDataURL("image/jpeg", 0.86));
      URL.revokeObjectURL(url);
      trackEvent("ticket_scan_captured", { source: "upload" });
      await detectFromCanvas(canvas, "upload");
    };
    image.onerror = () => { URL.revokeObjectURL(url); trackEvent("ticket_scan_failed", { source: "upload", reason: "image_read_error" }); setError("사진을 읽지 못했어요. 다른 이미지를 사용해 주세요."); };
    image.src = url;
  };

  return (
    <section className="ticket-scanner card card-weak">
      <div className="ticket-scanner-head">
        <div><p className="eyebrow">사진으로 빠르게 시작</p><h2>로또 용지 촬영</h2></div>
        <span className="body-small">기기는 저장하지 않아요</span>
      </div>
      <p className="body-small">용지 사진을 참고해 번호를 자동으로 찾고, 인식 결과는 직접 확인한 뒤 분석 리포트로 이어집니다.</p>
      {!active && <div className="row">
        <ProductButton size="medium" loading={starting} onClick={() => void startCamera()}>카메라 열기</ProductButton>
        <label className="product-button product-medium product-weak ticket-upload-label">사진 업로드<input className="sr-only" type="file" accept="image/*" capture="environment" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void uploadImage(file); event.currentTarget.value = ""; }} /></label>
      </div>}
      {active && <div className="ticket-camera-box"><video ref={videoRef} playsInline muted aria-label="로또 용지 촬영 화면" onLoadedMetadata={() => setCameraReady(true)} /><div className="ticket-camera-guide" aria-hidden="true" /><div className="row"><ProductButton size="medium" disabled={!cameraReady} onClick={() => void capture()}>사진 찍기</ProductButton><ProductButton tone="weak" size="medium" onClick={stopCamera}>닫기</ProductButton></div></div>}
      {captured && !active && <div className="ticket-captured"><img src={captured} alt="촬영한 로또 용지" /><ProductButton tone="weak" size="small" onClick={() => { setCaptured(""); setMessage(""); }}>사진 지우기</ProductButton></div>}
      {message && <p className="ticket-scanner-message" role="status">{message}</p>}
      {error && <p className="archive-error" role="alert">{error}</p>}
    </section>
  );
}
