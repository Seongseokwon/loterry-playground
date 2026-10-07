"use client";

import { useEffect, useRef, useState } from "react";
import { ProductButton } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics";

type Detector = { detect(source: CanvasImageSource): Promise<Array<{ rawValue?: string }>> };
type DetectorWindow = Window & { BarcodeDetector?: new () => Detector };

function parseNumbers(rawValues: string[]) {
  const numbers = rawValues.flatMap((value) => value.match(/\d{1,2}/g) ?? []).map(Number).filter((number) => number >= 1 && number <= 45);
  const unique = [...new Set(numbers)].sort((left, right) => left - right);
  return unique.length === 6 ? unique : null;
}

export function TicketScanner({ onNumbersDetected }: { onNumbersDetected: (numbers: number[]) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [captured, setCaptured] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setActive(false);
  };

  const detectFromCanvas = async (canvas: HTMLCanvasElement, source: "camera" | "upload") => {
    const DetectorClass = (window as DetectorWindow).BarcodeDetector;
    if (!DetectorClass) {
      setMessage("이 브라우저에서는 QR 자동 인식을 지원하지 않아요. 사진을 참고해 번호를 직접 선택해 주세요.");
      return;
    }
    try {
      const detected = await new DetectorClass().detect(canvas);
      const numbers = parseNumbers(detected.map((item) => item.rawValue ?? ""));
      if (numbers) {
        onNumbersDetected(numbers);
        trackEvent("ticket_scan_detected", { source, detectedNumbers: numbers.length });
        setMessage(`번호 ${numbers.join(", ")}를 자동으로 찾았어요. 결과를 확인하기 전에 번호를 한 번 더 확인해 주세요.`);
      } else {
        trackEvent("ticket_scan_failed", { source, reason: "six_numbers_not_found" });
        setMessage("QR에서 6개 번호를 확인하지 못했어요. 사진을 참고해 번호를 직접 선택해 주세요.");
      }
    } catch {
      trackEvent("ticket_scan_failed", { source, reason: "detector_error" });
      setMessage("QR을 읽지 못했어요. 사진을 참고해 번호를 직접 선택해 주세요.");
    }
  };

  const capture = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;
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
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("이 브라우저에서는 카메라를 사용할 수 없어요. 사진 업로드나 번호 직접 선택을 이용해 주세요.");
      return;
    }
    setError("");
    setMessage("");
    trackEvent("ticket_scan_started", { source: "camera" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      setActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      trackEvent("ticket_scan_failed", { source: "camera", reason: "permission_or_device" });
      setError("카메라 권한을 허용하지 않았거나 카메라를 찾을 수 없어요. 사진 업로드나 번호 직접 선택을 이용해 주세요.");
      stopCamera();
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
        <ProductButton size="medium" onClick={() => void startCamera()}>카메라 열기</ProductButton>
        <label className="product-button product-medium product-weak ticket-upload-label">사진 업로드<input className="sr-only" type="file" accept="image/*" capture="environment" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void uploadImage(file); event.currentTarget.value = ""; }} /></label>
      </div>}
      {active && <div className="ticket-camera-box"><video ref={videoRef} playsInline muted aria-label="로또 용지 촬영 화면" /><div className="ticket-camera-guide" aria-hidden="true" /><div className="row"><ProductButton size="medium" onClick={() => void capture()}>사진 찍기</ProductButton><ProductButton tone="weak" size="medium" onClick={stopCamera}>닫기</ProductButton></div></div>}
      {captured && !active && <div className="ticket-captured"><img src={captured} alt="촬영한 로또 용지" /><ProductButton tone="weak" size="small" onClick={() => { setCaptured(""); setMessage(""); }}>사진 지우기</ProductButton></div>}
      {message && <p className="ticket-scanner-message" role="status">{message}</p>}
      {error && <p className="archive-error" role="alert">{error}</p>}
    </section>
  );
}
