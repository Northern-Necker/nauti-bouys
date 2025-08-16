# D-ID Domain Configuration Instructions

## 🚨 IMPORTANT: D-ID Domain Requirements

D-ID Agents require you to add your domain to their allowed domains list. `localhost` is not permitted.

## 📋 Current Status

**Your D-ID Agent Details:**
- **Agent ID:** `v2_agt_AYiJdoSm`
- **Client Key:** `Z29vZ2xlLW9hdXRoMnwxMDcyODc2NjczODk5NDc0ODU0NDU6VVIxdU9IS1NPWVBUVnBmbUo5NXRo`

**Suggested Domains (from your D-ID dashboard):**
- ✅ `https://9895-2605-59c0-1e9-8300-4171-f0e8-eab1-689a.ngrok-free.app`
- ❌ `http://localhost:8000` (not allowed)
- ❓ `https://yourdomain.com` (placeholder)

## 🔧 Solution Options

### Option 1: Use ngrok (Recommended for Testing)

**Step 1: Add the ngrok domain to D-ID**
1. Go to your D-ID Studio dashboard
2. Navigate to your agent settings
3. Add this domain: `https://9895-2605-59c0-1e9-8300-4171-f0e8-eab1-689a.ngrok-free.app`

**Step 2: Access via ngrok URL**
1. Use this URL instead of localhost: `https://9895-2605-59c0-1e9-8300-4171-f0e8-eab1-689a.ngrok-free.app`
2. Open: `https://9895-2605-59c0-1e9-8300-4171-f0e8-eab1-689a.ngrok-free.app/did-agent-sdk-test.html`

### Option 2: Set up ngrok yourself

**Install ngrok:**
1. Download from https://ngrok.com/
2. Install and authenticate
3. Run: `ngrok http 8000` (or whatever port you're using)
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)
5. Add this URL to your D-ID agent domain settings

### Option 3: Use a Real Domain

**If you have a domain:**
1. Point your domain to your development server
2. Add your domain to D-ID agent settings
3. Access via your domain instead of localhost

## 🎯 Quick Test Steps

**Once you've added the ngrok domain to D-ID:**

1. **Make sure your server is running on port 8000:**
   ```bash
   cd C:\nauti-bouys
   python -m http.server 8000
   ```

2. **Access via ngrok URL:**
   ```
   https://9895-2605-59c0-1e9-8300-4171-f0e8-eab1-689a.ngrok-free.app/did-agent-sdk-test.html
   ```

3. **The D-ID agent should now load properly!**

## 🔍 How to Add Domain to D-ID

1. **Login to D-ID Studio:** https://studio.d-id.com/
2. **Find your agent:** Look for agent ID `v2_agt_AYiJdoSm`
3. **Agent Settings:** Click on settings/configuration
4. **Allowed Domains:** Add your ngrok URL
5. **Save:** Apply the changes

## 🚨 Troubleshooting

**If the ngrok URL doesn't work:**
- Make sure the domain is exactly added to D-ID (including https://)
- Check that your local server is still running
- Try accessing the ngrok URL directly first
- Clear browser cache

**Alternative ngrok setup:**
1. Download ngrok: https://ngrok.com/download
2. Extract and run: `ngrok http 8000`
3. Use the HTTPS URL it provides
4. Add that URL to your D-ID agent settings

## 📝 Next Steps

1. Add the ngrok domain to your D-ID agent configuration
2. Test the agent using the ngrok URL
3. Once working, you can integrate into your React app using the same domain requirements

---

**Remember:** Always use HTTPS URLs with D-ID, never HTTP or localhost!