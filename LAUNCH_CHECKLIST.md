# 🚀 PairCade Launch Checklist

## 📝 When Token Launches - Update Contract Address

### Quick Steps:
1. Open `/apps/web/src/config/contract.ts`
2. Update these fields:

```typescript
CONTRACT_ADDRESS: 'YOUR_ACTUAL_CONTRACT_ADDRESS_HERE', // Replace with real CA
SHOW_CONTRACT_ADDRESS: true,  // Set to true to show CA in header
IS_LAUNCHED: true,            // Set to true when live
```

### Example:
```typescript
// Before Launch (current):
CONTRACT_ADDRESS: 'Coming Soon...',
SHOW_CONTRACT_ADDRESS: false,
IS_LAUNCHED: false,

// After Launch:
CONTRACT_ADDRESS: 'AbCdEf1234567890YourActualContractAddress',
SHOW_CONTRACT_ADDRESS: true,
IS_LAUNCHED: true,
```

## 🔄 Deploy Changes

After updating the config:

1. **Test locally:**
   ```bash
   cd apps/web
   npm run dev
   ```
   Check that CA displays correctly in the header

2. **Deploy to production:**
   ```bash
   npm run build
   npm run deploy
   ```

3. **Commit changes:**
   ```bash
   git add .
   git commit -m "Add contract address for launch"
   git push
   ```

## ✅ Launch Day Checklist

- [ ] Deploy token contract on Solana
- [ ] Get Contract Address (CA)
- [ ] Update `/apps/web/src/config/contract.ts` with CA
- [ ] Set `SHOW_CONTRACT_ADDRESS: true`
- [ ] Set `IS_LAUNCHED: true`
- [ ] Test locally to verify CA displays
- [ ] Deploy frontend changes
- [ ] Post "BETA IS LIVE" tweet with CA
- [ ] Update social media bios with CA
- [ ] Monitor for any issues

## 📱 Social Media Templates

### With CA:
```
🚀 BETA IS LIVE!
CA: [YourContractAddress]
Play & Earn: [your-site-url]
#PairCade #Solana
```

### Dexscreener/Dextools:
```
📊 $PAIR now trackable!
Dexscreener: [link]
Join factions, earn rewards!
#PairCade
```

## 🔧 Troubleshooting

**CA not showing?**
- Check `SHOW_CONTRACT_ADDRESS` is `true`
- Clear browser cache
- Verify deployment completed

**Need to hide CA temporarily?**
- Set `SHOW_CONTRACT_ADDRESS: false`
- Redeploy

## 📞 Support

Remember: The CA will only show on desktop (lg screens) by default.
To show on mobile too, remove the `lg:` prefix from the className in Layout.tsx.

Good luck with the launch! 🚀🎮