/**
 * Create Admin User
 * Creates or promotes a user to admin status with password
 */

import { supabase } from './00-config';
import * as readline from 'readline';
import * as bcrypt from 'bcrypt';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function createAdmin() {
  console.log('👤 Create/Promote Admin User\n');

  const email = await ask('Email address: ');
  
  if (!email) {
    console.log('❌ Email is required');
    rl.close();
    return;
  }

  // Check if user exists
  const { data: existing } = await supabase
    .from('participants')
    .select('id, first_name, last_name, is_admin')
    .eq('email', email)
    .single();

  if (existing) {
    console.log(`\nFound existing user: ${existing.first_name} ${existing.last_name}`);
    
    if (existing.is_admin) {
      console.log('⚠️  User is already an admin');
      
      const resetPassword = await ask('Reset password? (yes/no): ');
      if (resetPassword.toLowerCase() !== 'yes') {
        console.log('❌ Cancelled\n');
        rl.close();
        return;
      }
    } else {
      console.log('Promoting to admin...');
    }

    const password = await ask('New password: ');
    if (!password || password.length < 8) {
      console.log('❌ Password must be at least 8 characters');
      rl.close();
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { error } = await supabase
      .from('participants')
      .update({
        is_admin: true,
        password_hash: passwordHash,
      })
      .eq('id', existing.id);

    if (error) {
      console.error('❌ Error:', error.message);
    } else {
      console.log(`\n✅ ${existing.first_name} ${existing.last_name} is now an admin!\n`);
    }

  } else {
    console.log('\n❌ No participant found with that email');
    console.log('   User must register for the event first\n');
  }

  rl.close();
}

createAdmin().catch(console.error);
