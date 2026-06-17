-- Practices for Momentum and Clearer Thinking.
-- Confident Communication practices were seeded in 013; this adds real
-- (non-demo) practice content for the other two launch directions so every
-- direction has something to practice. Idempotent.

insert into public.practices (direction_id, title, description, instructions, estimated_minutes, proof_prompt, is_active, sort_order)
select d.id, v.title, v.description, v.instructions, v.minutes, v.proof_prompt, true, v.sort_order
from public.directions d
join (values
  ('momentum','Do one five-minute step','Make progress small enough to begin.','Pick one useful five-minute action and finish it before checking anything else.',5,'What small step did you take, and what made it easier to start?',1),
  ('momentum','Restart after a pause','Begin again without waiting for motivation.','Choose one thing you paused. Take the smallest possible step to restart it today.',5,'What did you restart, and what helped you begin again?',2),
  ('momentum','Finish one open task','Close a small open loop.','Pick one unfinished item and make it visibly complete.',8,'What did you finish, and how did closing it feel?',3),
  ('clearer-thinking','Separate facts from assumptions','Notice what you know vs. what you assume.','Write what you know on one side and what you are assuming on the other.',6,'What did you know vs. assume, and what got clearer?',1),
  ('clearer-thinking','Write the one-sentence version','Make an idea simpler.','Take something you keep over-explaining and write it as one clear sentence.',5,'What idea did you shorten, and what did you cut?',2),
  ('clearer-thinking','Name the next question','Turn a vague worry into a useful question.','Write the single most useful question to guide your next step.',5,'What better question will guide your next step?',3)
) as v(slug, title, description, instructions, minutes, proof_prompt, sort_order) on v.slug = d.slug
where not exists (
  select 1 from public.practices p where p.direction_id = d.id and p.title = v.title
);
