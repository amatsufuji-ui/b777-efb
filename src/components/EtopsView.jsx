import React, { useState, useEffect, useMemo } from 'react';
import { SafeIcon } from './SharedComponents';
import { etopsData } from '../data/flightData';

const HF_CACHE_KEY = 'efb_arinc_hf_data';

export const EtopsView = ({ globalRoute = "", globalDest = "" }) => {
  const [routeInput, setRouteInput] = useState(globalRoute);
  const [aircraft, setAircraft] = useState("B777-300ER/B777F");
  const [destination, setDestination] = useState("EDDF");
  const [detectedRouteType, setDetectedRouteType] = useState("");
  const [manualRouteType, setManualRouteType] = useState("");
  
  const [todayInfo, setTodayInfo] = useState({ dateStr: "", isOdd: true });

  // 初期値を localStorage から読み込む
  const [hfData, setHfData] = useState(() => {
    try {
      const cached = localStorage.getItem(HF_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return { ...parsed, status: "CACHED" };
      }
    } catch (e) {
      console.warn("HF Data cache read failed");
    }
    return {
      asia: { pri: "11282", sec: "5547" },
      alaska: { pri: "10048", sec: "6673" },
      polar: { pri: "11342", sec: "8933", ter: "6640" },
      lastUpdated: "Default Info",
      isOnlineData: false,
      status: "Not Updated" 
    };
  });
  
  const [isFetchingHF, setIsFetchingHF] = useState(false);

  useEffect(() => {
    if (globalRoute) setRouteInput(globalRoute);
  }, [globalRoute]);

  useEffect(() => {
    if (globalDest) {
      const upperDest = globalDest.toUpperCase();
      const validDests = ["EDDF", "EGLL", "ESSA", "EBBR", "LFPG", "LIMC", "LOWW", "EDDM"];
      if (validDests.includes(upperDest)) setDestination(upperDest);
      else setDestination("Other");
    }
  }, [globalDest]);

  useEffect(() => {
    const type = detectRouteType(routeInput);
    setDetectedRouteType(type);
  }, [routeInput]);

  useEffect(() => {
    const d = new Date();
    const day = d.getUTCDate();
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    setTodayInfo({ dateStr: `${String(day).padStart(2, '0')} ${months[d.getUTCMonth()]}`, isOdd: day % 2 !== 0 });
  }, []);

  const fetchHFData = async () => {
    if (navigator.onLine === false) {
      setHfData(prev => ({ ...prev, status: prev.isOnlineData ? "CACHED" : "Not Updated" }));
      return;
    }
    
    setIsFetchingHF(true);
    setHfData(prev => ({ ...prev, status: "Fetching..." }));

    // ============================================================
    // ★ 発行していただいた Google Apps Script (GAS) のURL ★
    // ============================================================
    const GAS_URL = "https://script.google.com/macros/s/AKfycbz8_qiZlFNdgo1wlgYTL6b3E70U5emNbBWlMTRyeBb6JLjfL07ii34ZIonFA_oCYaHaZw/exec"; 
    
    const targetUrl = 'https://radio.arinc.net/pacific/';
    const timeKey = Math.floor(Date.now() / 600000); // 10分キャッシュキー
    let html = null;
    let success = false;
    
    const fetchMethods = [];

    // 1. Google Apps Script 経由 (iPadでも100%確実に成功)
    if (GAS_URL) {
      fetchMethods.push(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        try {
          const res = await fetch(GAS_URL, { signal: controller.signal, redirect: 'follow' });
          if (!res.ok) throw new Error('GAS Fetch failed');
          return await res.text();
        } finally {
          clearTimeout(timeoutId);
        }
      });
    }

    // 2. 予備：パブリックプロキシ (GAS未設定時のMac/PC用バックアップ)
    fetchMethods.push(
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        try {
          const res = await fetch(`https://api