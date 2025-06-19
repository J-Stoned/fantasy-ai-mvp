# 🎨 Hey Fantasy - Icon Specifications

## **Icon Design Requirements**

### **Chrome Web Store Standards:**
- **16x16px** - Toolbar icon
- **48x48px** - Extension management page  
- **128x128px** - Chrome Web Store listing

### **Design Concept: "Voice + Sports"**

**Primary Elements:**
- 🎤 **Microphone icon** (voice activation)
- 🏈 **Sports element** (football/general sports)
- 💜 **Brand gradient** (#667eea to #764ba2)
- ✨ **Modern, clean aesthetic**

### **Icon 16px (Toolbar):**
```
Simple microphone icon with subtle sports accent
- Minimal detail for small size
- High contrast for visibility
- Brand colors maintained
```

### **Icon 48px (Management):**
```
Microphone with sound waves + small sports icon
- More detail visible
- Brand gradient background
- Clear sports association
```

### **Icon 128px (Store Listing):**
```
Full design with:
- Prominent microphone
- Sports elements (football, basketball, etc.)
- "Hey Fantasy" text treatment
- Premium gradient background
- Professional finish
```

## **Brand Colors:**
- **Primary**: #667eea (Purple Blue)
- **Secondary**: #764ba2 (Deep Purple)
- **Accent**: #48bb78 (Success Green)
- **Text**: #2d3748 (Dark Gray)

## **SVG Icon Code for 128px:**

```svg
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f7fafc;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background Circle -->
  <circle cx="64" cy="64" r="60" fill="url(#grad1)" stroke="#4c51bf" stroke-width="2"/>
  
  <!-- Microphone Body -->
  <rect x="54" y="35" width="20" height="35" rx="10" ry="10" fill="url(#grad2)" stroke="#2d3748" stroke-width="2"/>
  
  <!-- Microphone Stand -->
  <rect x="62" y="70" width="4" height="20" fill="#2d3748"/>
  <rect x="52" y="88" width="24" height="4" rx="2" ry="2" fill="#2d3748"/>
  
  <!-- Sound Waves -->
  <path d="M 35 45 Q 25 55 35 65" stroke="#48bb78" stroke-width="3" fill="none" opacity="0.8"/>
  <path d="M 30 40 Q 15 55 30 70" stroke="#48bb78" stroke-width="2" fill="none" opacity="0.6"/>
  
  <path d="M 93 45 Q 103 55 93 65" stroke="#48bb78" stroke-width="3" fill="none" opacity="0.8"/>
  <path d="M 98 40 Q 113 55 98 70" stroke="#48bb78" stroke-width="2" fill="none" opacity="0.6"/>
  
  <!-- Sports Elements -->
  <circle cx="45" cy="25" r="8" fill="#ed8936" opacity="0.9"/> <!-- Basketball -->
  <ellipse cx="83" cy="25" rx="6" ry="4" fill="#8b4513" opacity="0.9"/> <!-- Football -->
  
  <!-- "HF" Text -->
  <text x="64" y="115" font-family="Arial, sans-serif" font-size="12" font-weight="bold" text-anchor="middle" fill="white">HF</text>
</svg>
```

## **Usage Instructions:**

1. **Save as PNG files** in /public/icons/ directory
2. **Optimize for web** (compress without quality loss)
3. **Test visibility** at actual sizes
4. **Ensure brand consistency** across all sizes

## **File Structure:**
```
public/icons/
├── icon16.png    # 16x16 toolbar icon
├── icon48.png    # 48x48 management icon  
├── icon128.png   # 128x128 store icon
└── icon.svg      # Source vector file
```

## **Quality Checklist:**
- [ ] Sharp edges at all sizes
- [ ] Readable at 16px
- [ ] Brand colors accurate
- [ ] Sports theme clear
- [ ] Voice/microphone prominent
- [ ] Professional appearance
- [ ] File sizes optimized