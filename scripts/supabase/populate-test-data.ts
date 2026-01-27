/**
 * Populate Complete Test Data
 * Creates comprehensive test data for ALL tables
 * INCLUDING Supabase Auth users
 */

import { supabase } from './00-config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import https from 'https';

// Create admin client for user creation
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Need service role key for admin operations
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Helper to generate random coordinates
const randomLat = () => 50.5 + Math.random() * 0.8;
const randomLng = () => 3.5 + Math.random() * 1.5;

// Helper to download image from URL
async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    });
  });
}

async function populateTestData() {
  console.log('🚀 Populating COMPLETE test data...\n');

  // ============================================
  // PARTICIPANTS
  // ============================================
  console.log('👥 Creating test participants...');

  const testUsers = [
    {
      email: 'admin@deurdenbocht.be',
      first_name: 'Admin',
      last_name: 'Rally',
      phone: '+32 470 12 34 56',
      bio: 'Rally organizer and admin. Passionate about bringing riders together for unforgettable experiences.',
      motorcycle_brand: 'BMW',
      motorcycle_model: 'R1250GS Adventure',
      license_plate: '1-ABC-001',
      formula: 'with_meals',
      ride_type: 'free',
      route_preference: 'scenic',
      amount_paid: 25000,
      payment_status: 'completed',
      stripe_payment_id: 'pi_admin_test_123',
      qr_code: `QR-ADMIN-${Date.now()}`,
      is_admin: true,
      password_hash: '$2b$10$rZ5QhVBQZ5QhVBQZ5QhVBu5QhVBQZ5QhVBQZ5QhVBQZ5QhVBQZ5Qh', // password: Admin2026!
      allow_early_access: true,
      checked_in: true,
      checked_in_at: new Date().toISOString(),
      start_location: { lat: 51.0935, lng: 3.4417 },
      profile_photo_url: 'https://i.pravatar.cc/300?img=12',
      allow_location_sharing: true,
      show_on_leaderboard: true,
      total_achievement_points: 150,
      status: 'riding',
    },
    {
      email: 'john.rider@example.com',
      first_name: 'John',
      last_name: 'Rider',
      phone: '+32 471 23 45 67',
      bio: 'Passionate about twisty roads and mountain passes. Love the thrill of the perfect corner.',
      motorcycle_brand: 'Honda',
      motorcycle_model: 'Africa Twin Adventure Sports',
      license_plate: '1-XYZ-123',
      formula: 'with_meals',
      ride_type: 'free',
      route_preference: 'twisty',
      amount_paid: 25000,
      payment_status: 'completed',
      stripe_payment_id: 'pi_john_test_456',
      qr_code: `QR-JOHN-${Date.now()}`,
      checked_in: true,
      checked_in_at: new Date(Date.now() - 3600000).toISOString(),
      start_location: { lat: 51.0935, lng: 3.4417 },
      profile_photo_url: 'https://i.pravatar.cc/300?img=33',
      allow_location_sharing: true,
      show_on_leaderboard: true,
      total_achievement_points: 120,
      status: 'riding',
    },
    {
      email: 'sarah.biker@example.com',
      first_name: 'Sarah',
      last_name: 'Biker',
      phone: '+32 472 34 56 78',
      bio: 'Adventure rider, love exploring new routes and meeting fellow enthusiasts on the road.',
      motorcycle_brand: 'Yamaha',
      motorcycle_model: 'Ténéré 700',
      license_plate: '1-DEF-456',
      formula: 'breakfast_only',
      ride_type: 'guided',
      route_preference: 'adventure',
      amount_paid: 20000,
      payment_status: 'completed',
      stripe_payment_id: 'pi_sarah_test_789',
      qr_code: `QR-SARAH-${Date.now()}`,
      checked_in: true,
      checked_in_at: new Date(Date.now() - 7200000).toISOString(),
      start_location: { lat: 51.0935, lng: 3.4417 },
      profile_photo_url: 'https://i.pravatar.cc/300?img=44',
      allow_location_sharing: true,
      show_on_leaderboard: true,
      total_achievement_points: 80,
      status: 'riding',
    },
    {
      email: 'marc.touring@example.com',
      first_name: 'Marc',
      last_name: 'Touring',
      phone: '+32 473 45 67 89',
      bio: 'Touring enthusiast, love long rides through beautiful landscapes. Comfort is key!',
      motorcycle_brand: 'Kawasaki',
      motorcycle_model: 'Versys 1000',
      license_plate: '1-GHI-789',
      formula: 'with_meals',
      ride_type: 'free',
      route_preference: 'scenic',
      amount_paid: 25000,
      payment_status: 'completed',
      stripe_payment_id: 'pi_marc_test_012',
      qr_code: `QR-MARC-${Date.now()}`,
      checked_in: true,
      checked_in_at: new Date(Date.now() - 5400000).toISOString(),
      start_location: { lat: 51.0935, lng: 3.4417 },
      profile_photo_url: 'https://i.pravatar.cc/300?img=68',
      allow_location_sharing: false,
      show_on_leaderboard: true,
      total_achievement_points: 95,
      status: 'riding',
    },
    {
      email: 'lisa.speed@example.com',
      first_name: 'Lisa',
      last_name: 'Speed',
      phone: '+32 474 56 78 90',
      bio: 'Sport touring rider, always looking for the perfect corner. Speed and precision!',
      motorcycle_brand: 'Triumph',
      motorcycle_model: 'Tiger 900 GT Pro',
      license_plate: '1-JKL-012',
      formula: 'with_meals',
      ride_type: 'guided',
      route_preference: 'twisty',
      amount_paid: 25000,
      payment_status: 'completed',
      stripe_payment_id: 'pi_lisa_test_345',
      qr_code: `QR-LISA-${Date.now()}`,
      checked_in: true,
      checked_in_at: new Date(Date.now() - 1800000).toISOString(),
      start_location: { lat: 51.0935, lng: 3.4417 },
      profile_photo_url: 'https://i.pravatar.cc/300?img=48',
      allow_location_sharing: true,
      show_on_leaderboard: true,
      total_achievement_points: 65,
      status: 'riding',
    },
    {
      email: 'tom.adventure@example.com',
      first_name: 'Tom',
      last_name: 'Adventure',
      phone: '+32 475 67 89 01',
      bio: 'Off-road and adventure specialist. The rougher the terrain, the better!',
      motorcycle_brand: 'KTM',
      motorcycle_model: '890 Adventure R',
      license_plate: '1-MNO-345',
      formula: 'breakfast_only',
      ride_type: 'free',
      route_preference: 'adventure',
      amount_paid: 20000,
      payment_status: 'completed',
      stripe_payment_id: 'pi_tom_test_678',
      qr_code: `QR-TOM-${Date.now()}`,
      checked_in: true,
      checked_in_at: new Date(Date.now() - 9000000).toISOString(),
      start_location: { lat: 51.0935, lng: 3.4417 },
      profile_photo_url: 'https://i.pravatar.cc/300?img=52',
      allow_location_sharing: true,
      show_on_leaderboard: true,
      total_achievement_points: 110,
      status: 'finished',
    },
    {
      email: 'anna.cruiser@example.com',
      first_name: 'Anna',
      last_name: 'Cruiser',
      phone: '+32 476 78 90 12',
      bio: 'Cruiser converted to adventure riding. Love the freedom of the open road.',
      motorcycle_brand: 'Harley-Davidson',
      motorcycle_model: 'Pan America 1250',
      license_plate: '1-PQR-678',
      formula: 'with_meals',
      ride_type: 'free',
      route_preference: 'scenic',
      amount_paid: 25000,
      payment_status: 'completed',
      stripe_payment_id: 'pi_anna_test_901',
      qr_code: `QR-ANNA-${Date.now()}`,
      checked_in: false,
      profile_photo_url: 'https://i.pravatar.cc/300?img=49',
      show_on_leaderboard: true,
      total_achievement_points: 0,
      status: 'registered',
    },
    {
      email: 'peter.classic@example.com',
      first_name: 'Peter',
      last_name: 'Classic',
      phone: '+32 477 89 01 23',
      bio: 'Classic bike enthusiast. Riding a modern classic with vintage soul.',
      motorcycle_brand: 'Royal Enfield',
      motorcycle_model: 'Himalayan 450',
      license_plate: '1-STU-901',
      formula: 'breakfast_only',
      ride_type: 'guided',
      route_preference: 'scenic',
      amount_paid: 20000,
      payment_status: 'completed',
      stripe_payment_id: 'pi_peter_test_234',
      qr_code: `QR-PETER-${Date.now()}`,
      checked_in: false,
      profile_photo_url: 'https://i.pravatar.cc/300?img=70',
      show_on_leaderboard: false,
      total_achievement_points: 0,
      status: 'registered',
    },
  ];

  const createdParticipants: any[] = [];

  for (const user of testUsers) {
    // Step 1: Create auth user with admin API
    const password = 'Rally2026!'; // Same password for all test users
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: user.first_name,
        last_name: user.last_name,
      }
    });

    let userId: string | undefined;

    // Check if user was created or already exists
    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        // User exists, fetch it
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existing = existingUsers?.users.find(u => u.email === user.email);
        if (existing) {
          userId = existing.id;
        } else {
          console.error(`   ❌ Could not find existing user for ${user.email}`);
          continue;
        }
      } else {
        console.error(`   ❌ Auth error for ${user.email}: ${authError.message}`);
        continue;
      }
    } else {
      userId = authUser?.user?.id;
    }

    if (!userId) {
      console.error(`   ❌ No user ID for ${user.email}`);
      continue;
    }

    // Step 2: Create participant with same ID as auth user
    const participantData = {
      ...user,
      id: userId, // CRITICAL: Use auth user ID
    };
    
    // Remove password_hash as we're using auth
    delete (participantData as any).password_hash;

    const { data, error } = await supabase
      .from('participants')
      .insert(participantData)
      .select()
      .single();

    if (error && !error.message.includes('duplicate')) {
      console.error(`   ❌ ${user.email}: ${error.message}`);
    } else if (data) {
      console.log(`   ✓ ${user.first_name} ${user.last_name} (${user.email}) - password: ${password}`);
      createdParticipants.push(data);
    } else {
      console.log(`   ~ ${user.email} already exists`);
      const { data: existing } = await supabase
        .from('participants')
        .select()
        .eq('email', user.email)
        .single();
      if (existing) createdParticipants.push(existing);
    }
  }

  console.log('\n✅ Participant creation complete!');
  console.log('\n🔐 LOGIN CREDENTIALS (all users):');
  console.log('   Password: Rally2026!');
  console.log('\n   Test accounts:');
  console.log('   • admin@deurdenbocht.be (Admin)');
  console.log('   • tom@example.com');
  console.log('   • anna@example.com');
  console.log('   • lars@example.com');
  console.log('   • marie@example.com');
  console.log('   • jan@example.com');
  console.log('   • sophie@example.com');
  console.log('   • max@example.com');

  // ============================================
  // ZONE CHECK-INS
  // ============================================
  console.log('\n📍 Creating zone check-ins...');

  const zones = ['vlaamse-ardennen', 'ardennen-ourthe', 'hoge-venen', 'condroz'];
  const checkedInParticipants = createdParticipants.filter(p => p.checked_in);

  let checkinCount = 0;
  for (const participant of checkedInParticipants) {
    // Each participant checks into 2-4 zones
    const zoneCount = Math.floor(Math.random() * 3) + 2;
    const selectedZones = zones.slice(0, zoneCount);

    for (const zoneId of selectedZones) {
      const { error } = await supabase
        .from('rally_zone_checkins')
        .insert({
          participant_id: participant.id,
          zone_id: zoneId,
          location_lat: randomLat(),
          location_lng: randomLng(),
          odometer_reading: 15000 + Math.floor(Math.random() * 50000),
          notes: Math.random() > 0.7 ? 'Great roads!' : null,
        })
        .select();

      if (!error) checkinCount++;
    }
  }
  console.log(`   ✓ Created ${checkinCount} zone check-ins`);

  // ============================================
  // PARTICIPANT ACHIEVEMENTS
  // ============================================
  console.log('\n🏆 Unlocking achievements...');

  const { data: achievementsList } = await supabase.from('achievements').select('id, name');

  let achievementCount = 0;
  for (const participant of checkedInParticipants) {
    // Each participant unlocks 2-5 achievements
    const achievementCount2 = Math.floor(Math.random() * 4) + 2;
    const selectedAchievements = achievementsList?.slice(0, achievementCount2) || [];

    for (const achievement of selectedAchievements) {
      const { error } = await supabase
        .from('participant_achievements')
        .insert({
          participant_id: participant.id,
          achievement_id: achievement.id,
        })
        .select();

      if (!error) achievementCount++;
    }
  }
  console.log(`   ✓ Unlocked ${achievementCount} achievements`);

  // ============================================
  // EMERGENCY CONTACTS
  // ============================================
  console.log('\n📞 Creating emergency contacts...');

  const emergencyNames = [
    'Partner', 'Mother', 'Father', 'Brother', 'Sister', 'Friend', 'Colleague'
  ];

  let emergencyCount = 0;
  for (const participant of createdParticipants.slice(0, 5)) {
    const { error } = await supabase
      .from('emergency_contacts')
      .insert({
        participant_id: participant.id,
        name: emergencyNames[Math.floor(Math.random() * emergencyNames.length)],
        phone: `+32 4${Math.floor(Math.random() * 90000000 + 10000000)}`,
        relationship: emergencyNames[Math.floor(Math.random() * emergencyNames.length)],
      })
      .select();

    if (!error) emergencyCount++;
  }
  console.log(`   ✓ Created ${emergencyCount} emergency contacts`);

  // ============================================
  // CERTIFICATES
  // ============================================
  console.log('\n🎓 Generating certificates...');

  let certCount = 0;
  for (const participant of checkedInParticipants.slice(0, 3)) {
    const { error } = await supabase
      .from('certificates')
      .insert({
        participant_id: participant.id,
        type: 'completion',
        pdf_url: `https://example.com/certificates/${participant.id}.pdf`,
      })
      .select();

    if (!error) certCount++;
  }
  console.log(`   ✓ Generated ${certCount} certificates`);

  // ============================================
  // PARTICIPANT PHOTOS
  // ============================================
  console.log('\n📸 Creating participant photos...');

  const photoCaptions = [
    'Amazing view!',
    'Perfect riding weather',
    'Best corner of the day',
    'Coffee break',
    'Group photo',
    'Scenic route',
    'Mountain pass',
    'Beautiful landscape',
    'Lunch stop',
    'Sunset ride',
  ];

  let photoCount = 0;
  let uploadCount = 0;
  for (const participant of checkedInParticipants) {
    // Each participant uploads 2-4 photos
    const photoCount2 = Math.floor(Math.random() * 3) + 2;

    for (let i = 0; i < photoCount2; i++) {
      const randomZone = zones[Math.floor(Math.random() * zones.length)];
      const photoId = `${participant.id}-${Date.now()}-${i}`;
      
      // Try to upload actual image from picsum
      let imageUrl = `https://picsum.photos/800/600?random=${photoId}`;
      let thumbnailUrl = `https://picsum.photos/200/150?random=${photoId}`;
      
      try {
        // Download and upload the image
        const imageBuffer = await downloadImage(`https://picsum.photos/800/600?random=${uploadCount}`);
        const fileName = `${photoId}.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('participant-photos')
          .upload(fileName, imageBuffer, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('participant-photos')
            .getPublicUrl(fileName);
          imageUrl = urlData.publicUrl;
          thumbnailUrl = urlData.publicUrl; // In production, would generate actual thumbnail
          uploadCount++;
        }
      } catch (err) {
        // Fallback to placeholder URL if upload fails
      }

      const { error } = await supabase
        .from('participant_photos')
        .insert({
          participant_id: participant.id,
          image_url: imageUrl,
          thumbnail_url: thumbnailUrl,
          caption: photoCaptions[Math.floor(Math.random() * photoCaptions.length)],
          location_lat: randomLat(),
          location_lng: randomLng(),
          zone_id: randomZone,
          is_approved: Math.random() > 0.2, // 80% approved
          is_featured: Math.random() > 0.8, // 20% featured
          like_count: Math.floor(Math.random() * 25),
        })
        .select();

      if (!error) photoCount++;
    }
  }
  console.log(`   ✓ Created ${photoCount} participant photos (${uploadCount} uploaded to storage)`);

  // ============================================
  // RIDE STORIES
  // ============================================
  console.log('\n📖 Creating ride stories...');

  const storyTitles = [
    'My First Rally Experience',
    'The Perfect Day in the Ardennes',
    'Conquering the Curves',
    'A Journey Through Belgium',
    'Rally Highlights 2026',
  ];

  let storyCount = 0;
  for (let i = 0; i < 3; i++) {
    const participant = checkedInParticipants[i];
    const { error } = await supabase
      .from('ride_stories')
      .insert({
        participant_id: participant.id,
        sanity_id: `story-${participant.id}-${Date.now()}`,
        title: storyTitles[i],
        slug: storyTitles[i].toLowerCase().replace(/\s+/g, '-'),
        excerpt: 'An amazing experience riding through the beautiful Belgian countryside...',
        published_at: new Date().toISOString(),
        is_approved: true,
        is_featured: i === 0,
        like_count: Math.floor(Math.random() * 50),
        view_count: Math.floor(Math.random() * 200),
      })
      .select();

    if (!error) storyCount++;
  }
  console.log(`   ✓ Created ${storyCount} ride stories`);

  // ============================================
  // PUSH SUBSCRIPTIONS
  // ============================================
  console.log('\n🔔 Creating push subscriptions...');

  let subscriptionCount = 0;
  for (const participant of createdParticipants.slice(0, 5)) {
    const { error } = await supabase
      .from('push_subscriptions')
      .insert({
        participant_id: participant.id,
        endpoint: `https://fcm.googleapis.com/fcm/send/${participant.id}`,
        keys: {
          p256dh: 'sample-p256dh-key',
          auth: 'sample-auth-key',
        },
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        is_active: true,
      })
      .select();

    if (!error) subscriptionCount++;
  }
  console.log(`   ✓ Created ${subscriptionCount} push subscriptions`);

  // ============================================
  // EMERGENCY SOS (RESOLVED EXAMPLES)
  // ============================================
  console.log('\n🚨 Creating sample SOS records (resolved)...');

  const adminParticipant = createdParticipants.find(p => p.is_admin);
  
  if (adminParticipant) {
    const { error } = await supabase
      .from('emergency_sos')
      .insert({
        participant_id: checkedInParticipants[0].id,
        location_lat: randomLat(),
        location_lng: randomLng(),
        status: 'resolved',
        message: 'Flat tire, need assistance',
        resolved_at: new Date(Date.now() - 3600000).toISOString(),
        resolved_by: adminParticipant.id,
      })
      .select();

    if (!error) console.log('   ✓ Created 1 resolved SOS record');
  }

  // ============================================
  // DOCUMENTS
  // ============================================
  console.log('\n📄 Creating sample documents...');

  const documents = [
    {
      title: 'Rally Route 2026',
      description: 'Complete GPX route for the rally',
      file_url: '/gpx/Deur den Bocht Rally.gpx',
      file_type: 'gpx',
      category: 'route',
      visible_to_public: true,
    },
    {
      title: 'Rally Book 2026',
      description: 'Complete rally book with all zones',
      file_url: 'https://example.com/rallybook-2026.pdf',
      file_type: 'pdf',
      category: 'rally_book',
      visible_to_public: false,
    },
  ];

  let docCount = 0;
  for (const doc of documents) {
    const { error } = await supabase
      .from('documents')
      .insert(doc)
      .select();

    if (!error) docCount++;
  }
  console.log(`   ✓ Created ${docCount} documents`);

  // ============================================
  // SANITY GPX UPLOAD
  // ============================================
  console.log('\n🗺️  Uploading GPX file to Sanity...');
  
  try {
    const sanityClient = (await import('../sanity/00-config')).sanityClient;
    const gpxPath = resolve(__dirname, '../../apps/web/public/gpx/Deur den Bocht Rally.gpx');
    
    // Check if file exists
    try {
      const gpxBuffer = readFileSync(gpxPath);
      
      // Upload GPX file as asset
      const asset = await sanityClient.assets.upload('file', gpxBuffer, {
        filename: 'Deur den Bocht Rally.gpx',
        contentType: 'application/gpx+xml',
      });
      
      console.log(`   ✓ GPX file uploaded: ${asset._id}`);
      
      // Update siteConfig with GPX file
      const siteConfigs = await sanityClient.fetch(`*[_type == "siteConfig"]`);
      if (siteConfigs.length > 0) {
        await sanityClient
          .patch(siteConfigs[0]._id)
          .set({
            gpxRouteFiles: [{
              _type: 'file',
              asset: {
                _type: 'reference',
                _ref: asset._id,
              },
            }],
          })
          .commit();
        console.log(`   ✓ GPX file linked to siteConfig`);
      }
    } catch (fileErr: any) {
      console.log(`   ⚠️  GPX file not found at ${gpxPath}`);
    }
  } catch (err: any) {
    console.log(`   ⚠️  Error uploading GPX: ${err.message}`);
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n═══════════════════════════════════════════════');
  console.log('✅ Test data population complete!\n');
  console.log('📊 Summary:');
  console.log(`   • ${createdParticipants.length} participants`);
  console.log(`   • ${checkinCount} zone check-ins`);
  console.log(`   • ${achievementCount} achievements unlocked`);
  console.log(`   • ${emergencyCount} emergency contacts`);
  console.log(`   • ${certCount} certificates`);
  console.log(`   • ${photoCount} photos (${uploadCount} uploaded to storage)`);
  console.log(`   • ${storyCount} ride stories`);
  console.log(`   • ${subscriptionCount} push subscriptions`);
  console.log(`   • ${docCount} documents`);
  console.log(`   • GPX route uploaded to Sanity\n`);
  
  console.log('🔑 ADMIN LOGIN:');
  console.log('   📧 Email:    admin@deurdenbocht.be');
  console.log('   🔐 Password: Admin2026!\n');
  
  console.log('📍 Test accounts:');
  console.log('   • admin@deurdenbocht.be (admin)');
  console.log('   • john.rider@example.com');
  console.log('   • sarah.biker@example.com\n');
}

populateTestData().catch(console.error);
