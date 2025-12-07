"use client";

import { useDynamicContext, DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { useState, useEffect } from "react";

export default function Home() {
  const { user: dynamicUser } = useDynamicContext();
  
  const [birthYear, setBirthYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // PII Form State
  const [showPIIForm, setShowPIIForm] = useState(false);
  const [piiData, setPIIData] = useState({
    fullName: "",
    phone: "",
    address: "",
    nationalId: "",
  });
  
  // Load saved PII from Privy backend
  const [savedPII, setSavedPII] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [piiLoading, setPIILoading] = useState(false);

  // 🔗 Helper function to extract wallet address from Dynamic user
  const getWalletAddress = (user: any): string | null => {
    const walletCred = user?.verifiedCredentials?.find(
      (cred: any) => cred.format === 'blockchain'
    );
    return walletCred?.address || null;
  };

  // Wait for client-side hydration to complete
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load saved PII from Privy API when user connects
  useEffect(() => {
    if (isClient && dynamicUser?.userId) {
      loadSavedPII();
    }
  }, [isClient, dynamicUser?.userId]);

  const loadSavedPII = async () => {
    if (!dynamicUser?.userId) return;
    
    // 🔗 Get wallet address
    const walletAddress = getWalletAddress(dynamicUser);
    
    if (!walletAddress) {
      console.error('No wallet address found');
      return;
    }
    
    setPIILoading(true);
    try {
      // 🔗 Pass both userId and walletAddress
      const response = await fetch(
        `/api/store?userId=${dynamicUser.userId}&walletAddress=${walletAddress}`
      );
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setSavedPII(result.data);
        }
      } else if (response.status === 404) {
        // No data found - this is fine for new users
        setSavedPII(null);
      }
    } catch (error) {
      console.error('Error loading PII:', error);
    } finally {
      setPIILoading(false);
    }
  };

  const handleGenerateProof = async () => {
    if (!birthYear) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/prove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthYear: parseInt(birthYear) }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error:", error);
      setResult({ success: false, error: "Failed to generate proof" });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePII = async () => {
    if (!piiData.fullName || !piiData.phone || !piiData.address) {
      alert("Please fill in all required fields");
      return;
    }

    // 🔗 Get wallet address from Dynamic user
    const walletAddress = getWalletAddress(dynamicUser);

    if (!walletAddress) {
      alert("❌ Could not find wallet address. Please reconnect your wallet.");
      return;
    }

    setPIILoading(true);
    try {
      // 🔗 Send userId, walletAddress, and piiData to backend
      const response = await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: dynamicUser?.userId,
          walletAddress: walletAddress,  // 🔗 NEW: Add wallet address
          piiData: piiData
        })
      });

      const result = await response.json();

      if (result.success) {
        alert("✅ Your information has been securely stored in Privy!");
        setShowPIIForm(false);
        // Reload saved data from Privy
        await loadSavedPII();
      } else {
        throw new Error(result.error || 'Failed to save');
      }
    } catch (error) {
      console.error("Failed to store PII:", error);
      alert("❌ Failed to save information. Please try again.");
    } finally {
      setPIILoading(false);
    }
  };

  // Don't render dynamic content until client-side hydration is complete
  if (!isClient) {
    return (
      <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              ZK Verification System
            </h1>
            <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            ZK Verification System
          </h1>
          <DynamicWidget />
        </div>

        {dynamicUser ? (
          <div className="space-y-6">
            {/* Section 1: ZK Proof Generation */}
            <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">
                1️⃣ Prove Eligibility (Anonymous)
              </h2>
              
              <div className="flex items-center gap-2 text-green-600">
                <span className="text-2xl">✅</span>
                <p className="font-medium">
                  Connected as {dynamicUser.email || dynamicUser.userId}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Your Birth Year
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 2000"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full max-w-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>

                <button
                  onClick={handleGenerateProof}
                  disabled={loading || !birthYear}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {loading ? "⏳ Generating ZK Proof..." : "🔐 Generate ZK Proof"}
                </button>
              </div>

              {result && (
                <div
                  className={`mt-6 p-6 rounded-lg ${
                    result.success
                      ? result.isAdult
                        ? "bg-green-50 border-2 border-green-200"
                        : "bg-red-50 border-2 border-red-200"
                      : "bg-red-50 border-2 border-red-200"
                  }`}
                >
                  {result.success ? (
                    <>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">
                          {result.isAdult ? "✅" : "❌"}
                        </span>
                        <p className="text-xl font-bold">
                          {result.isAdult ? "Age ≥ 18 Verified" : "Age < 18"}
                        </p>
                      </div>

                      <div className="space-y-2 text-sm text-gray-700">
                        <p>
                          <strong>Verification Method:</strong> Zero-Knowledge
                          Proof (Aleo)
                        </p>
                        <p>
                          <strong>Current Year:</strong> {result.currentYear}
                        </p>
                        <p className="italic text-gray-600">
                          🔒 Your exact birth year and age remain private
                        </p>
                      </div>

                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 font-medium">
                          🔍 Technical Details
                        </summary>
                        <div className="mt-2 text-xs bg-gray-50 p-3 rounded border">
                          <p>
                            <strong>Birth Year (Private Input):</strong>{" "}
                            {result.birthYear}
                          </p>
                          <p>
                            <strong>Age (Computed):</strong> {result.age}
                          </p>
                          <p>
                            <strong>Threshold:</strong> 18 years
                          </p>
                          <p>
                            <strong>Result:</strong>{" "}
                            {result.isAdult ? "PASS" : "FAIL"}
                          </p>
                          <p className="mt-2 text-gray-500">
                            Note: These details are shown for demo purposes. In
                            production, only the verification result would be
                            visible to third parties.
                          </p>
                        </div>
                      </details>
                    </>
                  ) : (
                    <p className="text-red-700 flex items-center gap-2">
                      <span className="text-2xl">❌</span>
                      {result.error}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Section 2: PII Storage with Privy */}
            <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">
                2️⃣ Store Contact Info (Encrypted with Privy)
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="text-blue-800">
                  <strong>🔒 Privy Encrypted Storage:</strong> Your data is encrypted and stored securely using Privy's infrastructure. Only you control access to this information.
                </p>
              </div>

              {piiLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                  <p className="mt-2 text-gray-600">Loading your information...</p>
                </div>
              ) : savedPII ? (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">✅</span>
                    <p className="font-bold text-green-800">Your information is securely stored in Privy</p>
                  </div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><strong>Name:</strong> {savedPII.fullName}</p>
                    <p><strong>Phone:</strong> {savedPII.phone}</p>
                    <p><strong>Address:</strong> {savedPII.address}</p>
                    {savedPII.nationalId && <p><strong>ID:</strong> {savedPII.nationalId}</p>}
                    <p className="text-xs text-gray-500 mt-4">
                      Stored: {new Date(savedPII.storedAt).toLocaleString()}
                    </p>
                    {savedPII.updatedAt !== savedPII.storedAt && (
                      <p className="text-xs text-gray-500">
                        Updated: {new Date(savedPII.updatedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <button 
                    onClick={() => {
                      // Pre-fill form with existing data
                      setPIIData({
                        fullName: savedPII.fullName,
                        phone: savedPII.phone,
                        address: savedPII.address,
                        nationalId: savedPII.nationalId || ''
                      });
                      setShowPIIForm(true);
                    }}
                    className="mt-4 text-blue-600 text-sm underline hover:text-blue-800"
                  >
                    Update Information
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowPIIForm(true)}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                >
                  📝 Add Personal Information
                </button>
              )}

              {showPIIForm && (
                <div className="space-y-4 border-t pt-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Enter your contact information. All data will be encrypted and stored securely using Privy.
                  </p>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={piiData.fullName}
                      onChange={(e) => setPIIData({...piiData, fullName: e.target.value})}
                      className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="+31 6 12345678"
                      value={piiData.phone}
                      onChange={(e) => setPIIData({...piiData, phone: e.target.value})}
                      className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Address *
                    </label>
                    <textarea
                      placeholder="Street, City, Country"
                      value={piiData.address}
                      onChange={(e) => setPIIData({...piiData, address: e.target.value})}
                      className="border border-gray-300 rounded-lg px-4 py-3 w-full h-24 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      National ID / Passport Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="ID Number"
                      value={piiData.nationalId}
                      onChange={(e) => setPIIData({...piiData, nationalId: e.target.value})}
                      className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleSavePII}
                      disabled={piiLoading || !piiData.fullName || !piiData.phone || !piiData.address}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      {piiLoading ? "⏳ Saving..." : "🔒 Encrypt & Save to Privy"}
                    </button>
                    <button
                      onClick={() => setShowPIIForm(false)}
                      disabled={piiLoading}
                      className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-medium transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600 text-lg mb-4">
              Please connect your wallet to get started
            </p>
            <p className="text-sm text-gray-500">
              You'll be able to prove your eligibility privately and store your contact information securely
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
