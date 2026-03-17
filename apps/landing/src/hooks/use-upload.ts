import { adlandApiUrl } from "@adland/data";

const useIPFSUpload = () => {
  const upload = async (data: object) => {
    const res = await fetch(`${adlandApiUrl}/ipfs/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error("IPFS upload failed");
    }
    const { uri } = await res.json();

    return uri;
  };

  return { upload };
};

export default useIPFSUpload;
