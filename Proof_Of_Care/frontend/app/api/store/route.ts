import { NextRequest, NextResponse } from 'next/server';

// Privy REST API base URL
const PRIVY_API_URL = 'https://auth.privy.io/api/v1';

// Helper to create Basic Auth header
function getPrivyAuthHeader() {
  const credentials = `${process.env.PRIVY_APP_ID}:${process.env.PRIVY_APP_SECRET}`;
  const base64Credentials = Buffer.from(credentials).toString('base64');
  return `Basic ${base64Credentials}`;
}

// ============================================
// HELPER: Get or Create Privy User
// ============================================
async function getOrCreatePrivyUser(
  dynamicUserId: string,
  walletAddress: string
): Promise<string> {
  console.log(`🔍 [GET_OR_CREATE] Starting for wallet: ${walletAddress.slice(0, 10)}...`);
  
  try {
    // First, try to find existing user by wallet
    const existingUser = await findPrivyUserByWallet(walletAddress);
    
    if (existingUser) {
      console.log(`✅ [FOUND] Existing Privy user: ${existingUser.id}`);
      return existingUser.id;
    }

    // If not found, create a new Privy user
    console.log(`🆕 [CREATE] Creating new Privy user...`);
    const createResponse = await fetch(`${PRIVY_API_URL}/users`, {
      method: 'POST',
      headers: {
        'Authorization': getPrivyAuthHeader(),
        'privy-app-id': process.env.PRIVY_APP_ID!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        linked_accounts: [
          {
            type: 'wallet',
            address: walletAddress,
            chain_type: 'ethereum',
            wallet_client: 'dynamic',
            verified_at: new Date().toISOString()
          }
        ]
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error(`❌ [CREATE ERROR] Status ${createResponse.status}:`, errorText);
      
      // Try to parse error for more details
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(`Privy API error: ${errorJson.error || errorJson.message || errorText}`);
      } catch {
        throw new Error(`Privy API error (${createResponse.status}): ${errorText}`);
      }
    }

    const newUser = await createResponse.json();
    console.log(`✅ [CREATED] New Privy user: ${newUser.id}`);
    return newUser.id;

  } catch (error: any) {
    console.error('❌ [GET_OR_CREATE ERROR]:', error.message);
    throw new Error(`Could not create or find Privy user: ${error.message}`);
  }
}

// ============================================
// HELPER: Find Privy User by Wallet
// ============================================
async function findPrivyUserByWallet(walletAddress: string): Promise<{ id: string } | null> {
  console.log(`🔍 [SEARCH] Looking for wallet: ${walletAddress.slice(0, 10)}...`);
  
  try {
    // Search for user with this wallet address
    const response = await fetch(`${PRIVY_API_URL}/users`, {
      method: 'GET',
      headers: {
        'Authorization': getPrivyAuthHeader(),
        'privy-app-id': process.env.PRIVY_APP_ID!,
      }
    });

    if (!response.ok) {
      console.error(`❌ [SEARCH ERROR] Failed to list users: ${response.status}`);
      return null;
    }

    const result = await response.json();
    // Handle both formats: direct array or { data: [] }
    const users = Array.isArray(result) ? result : (result.data || []);
    console.log(`📊 [SEARCH] Found ${users.length} total users`);
    
    // Find user with matching wallet address
    const user = users.find((u: any) => 
      u.linked_accounts?.some((account: any) => 
        account.type === 'wallet' && 
        account.address?.toLowerCase() === walletAddress.toLowerCase()
      )
    );

    if (user) {
      console.log(`✅ [FOUND] User ${user.id} has wallet ${walletAddress.slice(0, 10)}...`);
    } else {
      console.log(`ℹ️ [NOT FOUND] No user with wallet ${walletAddress.slice(0, 10)}...`);
    }

    return user || null;
    
  } catch (error: any) {
    console.error('❌ [SEARCH ERROR]:', error.message);
    return null;
  }
}

// ============================================
// POST - STORE PII IN PRIVY via REST API
// ============================================
export async function POST(req: NextRequest) {
  console.log('\n🚀 [POST /api/store] Starting...');
  
  try {
    const { userId, walletAddress, piiData } = await req.json();
    console.log(`📥 [REQUEST] userId: ${userId?.slice(0, 10)}..., wallet: ${walletAddress?.slice(0, 10)}...`);

    // Validate inputs
    if (!userId || !walletAddress || !piiData) {
      console.error('❌ [VALIDATION] Missing required fields');
      return NextResponse.json(
        { success: false, error: 'User ID, wallet address, and PII data are required' },
        { status: 400 }
      );
    }

    // Validate PII data
    if (!piiData.fullName || !piiData.phone || !piiData.address) {
      console.error('❌ [VALIDATION] Missing PII fields');
      return NextResponse.json(
        { success: false, error: 'Full name, phone, and address are required' },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!process.env.PRIVY_APP_ID || !process.env.PRIVY_APP_SECRET) {
      console.error('❌ [CONFIG] Missing Privy credentials');
      return NextResponse.json(
        { success: false, error: 'Server configuration error: Missing Privy credentials' },
        { status: 500 }
      );
    }

    // 🔗 Get or create linked Privy user
    const privyUserId = await getOrCreatePrivyUser(userId, walletAddress);
    console.log(`✅ [PRIVY USER] Using Privy user ID: ${privyUserId}`);

    // Store PII in Privy's custom metadata
    console.log(`💾 [STORING] Saving PII to Privy...`);
    const response = await fetch(`${PRIVY_API_URL}/users/${privyUserId}/custom_metadata`, {
      method: 'POST',
      headers: {
        'Authorization': getPrivyAuthHeader(),
        'privy-app-id': process.env.PRIVY_APP_ID!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        custom_metadata: {
          fullName: piiData.fullName,
          phone: piiData.phone,
          address: piiData.address,
          nationalId: piiData.nationalId || '',
          dynamicUserId: userId,
          walletAddress: walletAddress,
          storedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ [PRIVY STORE ERROR]:', error);
      throw new Error(`Privy API error: ${response.status}`);
    }

    console.log(`✅ [SUCCESS] PII stored for Privy user: ${privyUserId.slice(0, 10)}...`);

    return NextResponse.json({ 
      success: true,
      message: 'Data stored securely in Privy',
      privyUserId: privyUserId
    });

  } catch (error: any) {
    console.error('❌ [POST ERROR]:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to store data in Privy' 
      },
      { status: 500 }
    );
  }
}

// ============================================
// GET - RETRIEVE PII FROM PRIVY via REST API
// ============================================
export async function GET(req: NextRequest) {
  console.log('\n🚀 [GET /api/store] Starting...');
  
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const walletAddress = searchParams.get('walletAddress');
    console.log(`📥 [REQUEST] userId: ${userId?.slice(0, 10)}..., wallet: ${walletAddress?.slice(0, 10)}...`);

    if (!userId || !walletAddress) {
      console.error('❌ [VALIDATION] Missing userId or walletAddress');
      return NextResponse.json(
        { success: false, error: 'User ID and wallet address are required' },
        { status: 400 }
      );
    }

    // 🔗 Get linked Privy user
    const privyUserId = await getOrCreatePrivyUser(userId, walletAddress);
    console.log(`✅ [PRIVY USER] Using Privy user ID: ${privyUserId}`);

    // Retrieve user data from Privy
    console.log(`📥 [RETRIEVING] Fetching PII from Privy...`);
    const response = await fetch(`${PRIVY_API_URL}/users/${privyUserId}`, {
      method: 'GET',
      headers: {
        'Authorization': getPrivyAuthHeader(),
        'privy-app-id': process.env.PRIVY_APP_ID!
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`ℹ️ [NOT FOUND] No data for user ${privyUserId}`);
        return NextResponse.json(
          { success: false, error: 'No data found for this user' },
          { status: 404 }
        );
      }
      throw new Error(`Privy API error: ${response.status}`);
    }

    const user = await response.json();

    if (!user.custom_metadata) {
      console.log(`ℹ️ [NO METADATA] User ${privyUserId} has no custom data`);
      return NextResponse.json(
        { success: false, error: 'No custom data found for this user' },
        { status: 404 }
      );
    }

    console.log(`✅ [SUCCESS] Retrieved PII for user: ${privyUserId.slice(0, 10)}...`);

    return NextResponse.json({ 
      success: true,
      data: user.custom_metadata
    });

  } catch (error: any) {
    console.error('❌ [GET ERROR]:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to retrieve data from Privy' 
      },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - REMOVE PII FROM PRIVY (GDPR)
// ============================================
export async function DELETE(req: NextRequest) {
  console.log('\n🚀 [DELETE /api/store] Starting...');
  
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const walletAddress = searchParams.get('walletAddress');
    console.log(`📥 [REQUEST] userId: ${userId?.slice(0, 10)}..., wallet: ${walletAddress?.slice(0, 10)}...`);

    if (!userId || !walletAddress) {
      console.error('❌ [VALIDATION] Missing userId or walletAddress');
      return NextResponse.json(
        { success: false, error: 'User ID and wallet address are required' },
        { status: 400 }
      );
    }

    // 🔗 Get linked Privy user
    const privyUserId = await getOrCreatePrivyUser(userId, walletAddress);
    console.log(`✅ [PRIVY USER] Using Privy user ID: ${privyUserId}`);

    // Clear custom metadata
    console.log(`🗑️ [DELETING] Removing PII from Privy...`);
    const response = await fetch(`${PRIVY_API_URL}/users/${privyUserId}/custom_metadata`, {
      method: 'POST',
      headers: {
        'Authorization': getPrivyAuthHeader(),
        'privy-app-id': process.env.PRIVY_APP_ID!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        custom_metadata: {}
      })
    });

    if (!response.ok) {
      throw new Error(`Privy API error: ${response.status}`);
    }

    console.log(`✅ [SUCCESS] Deleted PII for user: ${privyUserId.slice(0, 10)}...`);

    return NextResponse.json({ 
      success: true,
      message: 'Data deleted from Privy' 
    });

  } catch (error: any) {
    console.error('❌ [DELETE ERROR]:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to delete data from Privy' 
      },
      { status: 500 }
    );
  }
}
