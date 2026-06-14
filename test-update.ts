import { supabase } from './src/services/supabase';

async function test() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('User not logged in');
      return;
    }

    console.log('User ID:', user.id);

    // Fetch the first task
    const { data: tasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);

    if (fetchError || !tasks || tasks.length === 0) {
      console.log('No tasks found or error:', fetchError);
      return;
    }

    const task = tasks[0];
    console.log('Task found:', task.title, 'is_pinned currently:', task.is_pinned);

    // Update is_pinned
    const { data: updated, error: updateError } = await supabase
      .from('tasks')
      .update({ is_pinned: true })
      .eq('id', task.id)
      .select()
      .single();

    if (updateError) {
      console.log('Update Error:', updateError);
    } else {
      console.log('Update Success:', updated);
    }

  } catch (err) {
    console.error(err);
  }
}

test();
