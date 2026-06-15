import { useCallback, useMemo, useState, useEffect } from "react";
import { settingsApi } from "../../../services/api";

/**
 * Fetches the document configuration from settings and exposes a
 * per-field `isDocRequired(key)` helper. The composer uses this to
 * decide whether a missing birth/transfer/aadhaar upload is a validation
 * error.
 */
export default function useDocumentConfigs() {
  const [documentConfigs, setDocumentConfigs] = useState([]);

  useEffect(() => {
    let cancelled = false;
    settingsApi
      .getDocumentConfig()
      .then((cfgs) => {
        if (!cancelled) setDocumentConfigs(cfgs || []);
      })
      .catch(() => {
        if (!cancelled) setDocumentConfigs([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const docConfigMap = useMemo(() => {
    const map = {};
    for (const cfg of Array.isArray(documentConfigs) ? documentConfigs : []) {
      const name = (cfg.documentName || "").toLowerCase().trim();
      if (name.includes("birth")) map.birthCertificate = cfg;
      else if (name.includes("transfer") || name.includes("tc"))
        map.transferCertificate = cfg;
      else if (name.includes("aadhaar") || name.includes("aadhar"))
        map.aadhaar = cfg;
    }
    return map;
  }, [documentConfigs]);

  const isDocRequired = useCallback(
    (key) => {
      if (key === "aadhaarFront" || key === "aadhaarBack")
        return docConfigMap.aadhaar?.isRequired || false;
      return docConfigMap[key]?.isRequired || false;
    },
    [docConfigMap]
  );

  return { isDocRequired };
}
