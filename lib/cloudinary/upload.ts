type SignedUpload = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  resourceType: "image" | "video" | "raw";
};

const getSignature = async (resourceType: SignedUpload["resourceType"]) => {
  const res = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resourceType }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || "Failed to get upload signature");
  }
  return (await res.json()) as SignedUpload;
};

export const uploadToCloudinary = async (
  file: File | Blob,
  opts: { kind: "image" | "audio"; filename?: string },
) => {
  const resourceType: SignedUpload["resourceType"] =
    opts.kind === "audio" ? "video" : "image";

  const sig = await getSignature(resourceType);

  const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/${resourceType}/upload`;

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("folder", sig.folder);
  form.append("signature", sig.signature);

  if (opts.filename) form.append("public_id", opts.filename);

  const res = await fetch(url, { method: "POST", body: form });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "Upload failed");
  }

  return {
    url: data.secure_url as string,
    publicId: data.public_id as string,
    bytes: data.bytes as number,
    format: data.format as string,
    resourceType: data.resource_type as string,
  };
};
