# Manual Zone Update Guide - Sanity Studio

Since the migration script requires write API permissions, follow these manual steps to update your zones in Sanity Studio:

## 🎯 Zone Type Distribution (Recommended)

| Zone # | Type | Distance | Checkpoints |
|--------|------|----------|-------------|
| 1 | **Short** | 8 km | 1 |
| 2 | **Medium** | 18 km | 2 |
| 3 | **Medium** | 20 km | 2 |
| 4 | **Long** | 35 km | 3 |
| 5 | **Medium** | 22 km | 2 |
| 6 | **Short** | 6 km | 1 |
| 7 | **Medium** | 19 km | 2 |
| 8 | **Long** | 40 km | 3 |

## 📝 Step-by-Step Instructions

### 1. Open Sanity Studio

```bash
cd sanity-studio
npm run dev
```

Navigate to http://localhost:3333

### 2. Update Each Zone

For each Rally Zone, add these new fields:

#### Zone Type
Select from dropdown:
- Type A – Korte Verleider (5-8 km, 1 checkpoint) → `short`
- Type B – Beslisser (15-25 km, 2 checkpoints) → `medium`
- Type C – De Grote Omweg (30-45 km, 3 checkpoints) → `long`

#### Estimated Distance
Enter the estimated loop distance in kilometers (e.g., `8`, `18`, `35`)

#### Checkpoints Array
Click "Add Item" for each checkpoint (1-3 based on zone type):

**Checkpoint 1** (copy from existing checkpoint/solution fields):
- **Name**: `Checkpoint 1`
- **Description**: [copy from old "Checkpoint" field]
- **Code Hint**: [copy from old "Code Hint" field]
- **Solution**: [copy from old "Solution" field]
- **Valid Answers**: [copy from old "Valid Answers" array]
- **Location** (optional): Add GPS coordinates if known

**Checkpoint 2** (for medium/long zones - you need to define this):
- **Name**: `Checkpoint 2`
- **Description**: `[Define second checkpoint location/feature]`
- **Code Hint**: `[What to look for]`
- **Solution**: `[Correct answer]`
- **Valid Answers**: Add variations of the answer

**Checkpoint 3** (for long zones only - you need to define this):
- **Name**: `Checkpoint 3`
- **Description**: `[Define third checkpoint location/feature]`
- **Code Hint**: `[What to look for]`
- **Solution**: `[Correct answer]`
- **Valid Answers**: Add variations

### 3. Example: Zone 1 (Short)

```
Zone Type: short
Estimated Distance: 8
Checkpoints:
  - Checkpoint 1:
      Name: Checkpoint 1
      Description: Voetbrug over de Schelde
      Code Hint: woord op het brugbord
      Solution: SCHELDE
      Valid Answers: ["SCHELDE", "Schelde", "schelde"]
```

### 4. Example: Zone 2 (Medium - 2 checkpoints)

```
Zone Type: medium
Estimated Distance: 18
Checkpoints:
  - Checkpoint 1:
      Name: Checkpoint 1
      Description: Naambord van het domein
      Code Hint: naam van het domein
      Solution: [existing solution]
      Valid Answers: [existing valid answers]
  - Checkpoint 2:
      Name: Checkpoint 2
      Description: [YOU NEED TO DEFINE - e.g., "Tweede kruispunt, blauwe pijl"]
      Code Hint: [e.g., "Richting aangegeven"]
      Solution: [e.g., "NOORD"]
      Valid Answers: [e.g., ["NOORD", "Noord", "N"]]
```

### 5. Example: Zone 4 (Long - 3 checkpoints)

```
Zone Type: long
Estimated Distance: 35
Checkpoints:
  - Checkpoint 1:
      [existing checkpoint data]
  - Checkpoint 2:
      [YOU NEED TO DEFINE]
  - Checkpoint 3:
      [YOU NEED TO DEFINE]
```

## ⚠️ Important Notes

1. **Don't delete the old fields** (checkpoint, codeHint, solution, validAnswers) - they're now hidden but kept for backward compatibility

2. **For zones you've already defined** - just copy the existing single checkpoint data into Checkpoint 1 of the array

3. **For additional checkpoints** - you need to plan and define these based on your actual rally route

4. **GPS coordinates** are optional but recommended for checkpoint validation

5. **Save each zone** after updating all fields

## ✅ Verification

After updating all zones:

1. Check that all zones have `zoneType` set
2. Verify `estimatedDistance` is filled in
3. Confirm each zone has correct number of checkpoints:
   - Short (Type A): 1 checkpoint
   - Medium (Type B): 2 checkpoints
   - Long (Type C): 3 checkpoints
4. Make sure all checkpoint solutions are defined

## 🚀 After Manual Update

Once all zones are updated in Sanity:

1. The website will automatically pick up the new structure
2. Zone detail pages will show multiple checkpoints
3. Participants can submit codes per checkpoint
4. Points will calculate according to zone type

## 🆘 Quick Command Reference

```bash
# Start Sanity Studio
cd sanity-studio
npm run dev

# Check Sanity in browser
open http://localhost:3333
```

## 📞 Need Help?

If you need help defining additional checkpoints for medium/long zones, plan them based on:
- Natural landmarks visible from the road
- Unique features riders will definitely notice
- Logical progression through the zone
- Things that are permanent (not seasonal)

Good luck! 🏁
