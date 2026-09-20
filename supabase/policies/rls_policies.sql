
-- USER_PROFILE
CREATE POLICY "Users can view own profile"
ON public.user_profile
FOR SELECT
TO authenticated
USING (auth.uid() = uid);

CREATE POLICY "Users can insert own profile"
ON public.user_profile
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = uid);

CREATE POLICY "Users can update own profile"
ON public.user_profile
FOR UPDATE
TO authenticated
USING (auth.uid() = uid)
WITH CHECK (auth.uid() = uid);

CREATE POLICY "Users can delete own profile"
ON public.user_profile
FOR DELETE
TO authenticated
USING (auth.uid() = uid);


-- USER_INFO
CREATE POLICY "Users can view own info"
ON public.user_info
FOR SELECT
TO authenticated
USING (auth.uid() = uid);

CREATE POLICY "Users can insert own info"
ON public.user_info
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = uid);

CREATE POLICY "Users can update own info"
ON public.user_info
FOR UPDATE
TO authenticated
USING (auth.uid() = uid)
WITH CHECK (auth.uid() = uid);

CREATE POLICY "Users can delete own info"
ON public.user_info
FOR DELETE
TO authenticated
USING (auth.uid() = uid);