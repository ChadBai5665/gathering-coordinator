-- 修复 participants 表的 RLS 策略
-- 问题：service_role 也受到 authenticated 策略限制，导致后端插入失败

-- 删除旧策略
DROP POLICY IF EXISTS "participants_insert" ON participants;

-- service_role 无限制（后端 API 调用）
CREATE POLICY "participants_insert_service"
  ON participants FOR INSERT
  TO service_role
  WITH CHECK (true);

-- authenticated 只能插入自己的记录（前端直接调用）
CREATE POLICY "participants_insert_authenticated"
  ON participants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
