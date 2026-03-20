# Product Guidelines

## Prose & Writing Style

### Tone
- **Friendly & Casual**: Use approachable, conversational language that feels warm and inviting
- Write as if speaking to a friend during a game night
- Avoid overly formal or stiff language

### Voice
- **Encouraging**: Celebrate player wins with positive messages
- **Playful**: Add game-themed personality and light banter
- Gentle feedback for setbacks (e.g., bankruptcy, bad rolls)

### Examples
- ✅ "অভিনন্দন! আপনি রাজশাহী কিনেছেন!" (Congratulations! You bought Rajshahi!)
- ✅ "উহ্‌! খারাপ লটরি। পরের বার ভালো হবে!" (Oops! Bad lottery. Next time will be better!)
- ❌ "আপনার ব্যাংক ব্যালেন্স অপর্যাপ্ত।" (Your bank balance is insufficient.)

---

## Branding & Visual Identity

### Bangladeshi Heritage Theme
- **Colors**: Primary green (#006a4e) and red (#f42a41) from Bangladesh flag
- **Accent Colors**: Earth tones representing Bengali landscape
- **Art Style**: Simple patterns inspired by Nakshi Kantha and traditional motifs
- **Icons**: Minimalist representations of Bangladeshi landmarks

### City Names
- Use authentic Bangla names for all properties (districts of Bangladesh)
- Order properties by division/district hierarchy
- Include local landmarks in property descriptions

### Currency
- Display amounts in Bangla numerics (৳ symbol with Bangla numbers)
- Use "টাকা" (Taka) as currency name throughout

---

## Language Localization

### Bangla Elements (Required)
- **Board**: All board text, space names, corner squares
- **City Names**: All 8 divisions and district names
- **Currency**: Amounts displayed with Bangla numerals and ৳ symbol
- **Card Text**: Chance and Community Chest equivalents in Bangla

### English Elements
- Menu navigation and settings
- Player chat and communication
- System messages and notifications
- CLI output and documentation
- Error messages and help text

### Implementation Notes
- Maintain separate localization files for Bangla and English
- Allow runtime language switching for English elements
- Ensure proper Unicode rendering for Bangla text

---

## UX Principles

### Accessibility First
- Touch targets minimum 44x44px for easy tapping
- High contrast ratios (WCAG AA minimum)
- Clear visual feedback for all interactions
- Support for screen readers

### Performance-Conscious Design
- No auto-playing animations or videos
- Lazy-load all non-critical assets
- Use CSS sprites for repeated graphics
- Inline critical CSS for fast first paint

### Mobile-First Layout
- Design for 320px width minimum
- **Separate UI layouts for portrait and landscape orientations**
- Portrait: Vertical scroll, single-column layout, bottom navigation
- Landscape: Horizontal layout, two-column view, side navigation
- Thumb-friendly navigation zones for each orientation
- Minimal scrolling for core actions

---

## Player Communication

### Game Messages
- Turn reminders: "আপনার পালা! একটি ছক্কা দিন।" (Your turn! Roll the dice.)
- Transaction confirmations: "৫০০৳ পরিশোধ করা হয়েছে।" (500৳ paid.)
- Trade offers: Clear, actionable prompts

### Error States
- Friendly explanations, not technical jargon
- Offer solutions or next steps
- Example: "ইন্টারনেট সংযোগ নেই। স্বয়ংক্রিয়ভাবে পুনরায় সংযোগ করা হচ্ছে..." (No internet connection. Reconnecting automatically...)

### Loading States
- Show progress indicators for sync operations
- Use playful loading messages related to the game
- Never leave users wondering what's happening

---

## Cultural Sensitivity

### Respectful Representation
- Use authentic Bangla spellings for all place names
- Avoid stereotypes or caricatures
- Represent diverse Bangladeshi culture inclusively

### Local Relevance
- Reference local festivals (Pohela Boishakh, Eid) in seasonal events
- Use familiar cultural touchpoints in card text
- Include popular Bangladeshi foods in game elements (optional)
