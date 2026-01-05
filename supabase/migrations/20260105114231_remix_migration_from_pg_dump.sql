CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chat_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);


--
-- Name: conversation_folders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_folders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    parent_id uuid,
    color text DEFAULT '#6366f1'::text,
    icon text DEFAULT 'folder'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: conversation_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    tag text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: conversation_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    icon text DEFAULT '💬'::text,
    system_prompt text NOT NULL,
    category text NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    folder_id uuid
);


--
-- Name: favorite_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favorite_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    conversation_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: favorite_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favorite_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    message_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    display_name text,
    avatar_url text,
    bio text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: shared_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shared_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    share_token text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    view_count integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    ai_response_style text DEFAULT 'balanced'::text,
    voice_enabled boolean DEFAULT true,
    voice_name text DEFAULT 'default'::text,
    theme text DEFAULT 'dark'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: conversation_folders conversation_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_folders
    ADD CONSTRAINT conversation_folders_pkey PRIMARY KEY (id);


--
-- Name: conversation_tags conversation_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_tags
    ADD CONSTRAINT conversation_tags_pkey PRIMARY KEY (id);


--
-- Name: conversation_templates conversation_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_templates
    ADD CONSTRAINT conversation_templates_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: favorite_conversations favorite_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorite_conversations
    ADD CONSTRAINT favorite_conversations_pkey PRIMARY KEY (id);


--
-- Name: favorite_conversations favorite_conversations_user_id_conversation_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorite_conversations
    ADD CONSTRAINT favorite_conversations_user_id_conversation_id_key UNIQUE (user_id, conversation_id);


--
-- Name: favorite_messages favorite_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorite_messages
    ADD CONSTRAINT favorite_messages_pkey PRIMARY KEY (id);


--
-- Name: favorite_messages favorite_messages_user_id_message_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorite_messages
    ADD CONSTRAINT favorite_messages_user_id_message_id_key UNIQUE (user_id, message_id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: shared_conversations shared_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shared_conversations
    ADD CONSTRAINT shared_conversations_pkey PRIMARY KEY (id);


--
-- Name: shared_conversations shared_conversations_share_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shared_conversations
    ADD CONSTRAINT shared_conversations_share_token_key UNIQUE (share_token);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);


--
-- Name: idx_chat_messages_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_conversation_id ON public.chat_messages USING btree (conversation_id);


--
-- Name: idx_conversation_folders_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversation_folders_parent_id ON public.conversation_folders USING btree (parent_id);


--
-- Name: idx_conversation_folders_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversation_folders_user_id ON public.conversation_folders USING btree (user_id);


--
-- Name: idx_conversation_tags_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversation_tags_conversation_id ON public.conversation_tags USING btree (conversation_id);


--
-- Name: idx_conversation_tags_tag; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversation_tags_tag ON public.conversation_tags USING btree (tag);


--
-- Name: idx_conversations_folder_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_folder_id ON public.conversations USING btree (folder_id);


--
-- Name: idx_conversations_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_user_id ON public.conversations USING btree (user_id);


--
-- Name: idx_favorite_conversations_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favorite_conversations_user_id ON public.favorite_conversations USING btree (user_id);


--
-- Name: idx_favorite_messages_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favorite_messages_user_id ON public.favorite_messages USING btree (user_id);


--
-- Name: idx_shared_conversations_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shared_conversations_conversation_id ON public.shared_conversations USING btree (conversation_id);


--
-- Name: idx_shared_conversations_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shared_conversations_token ON public.shared_conversations USING btree (share_token);


--
-- Name: conversations update_conversations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_preferences update_user_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: chat_messages chat_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: conversation_folders conversation_folders_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_folders
    ADD CONSTRAINT conversation_folders_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.conversation_folders(id) ON DELETE CASCADE;


--
-- Name: conversation_folders conversation_folders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_folders
    ADD CONSTRAINT conversation_folders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: conversation_tags conversation_tags_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_tags
    ADD CONSTRAINT conversation_tags_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.conversation_folders(id) ON DELETE SET NULL;


--
-- Name: favorite_conversations favorite_conversations_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorite_conversations
    ADD CONSTRAINT favorite_conversations_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: favorite_messages favorite_messages_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorite_messages
    ADD CONSTRAINT favorite_messages_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.chat_messages(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: shared_conversations Anyone can view active shared conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active shared conversations" ON public.shared_conversations FOR SELECT USING (((is_active = true) AND ((expires_at IS NULL) OR (expires_at > now()))));


--
-- Name: profiles Authenticated users can view profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);


--
-- Name: conversation_templates Templates are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Templates are viewable by everyone" ON public.conversation_templates FOR SELECT USING (true);


--
-- Name: conversation_tags Users can add tags to their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add tags to their conversations" ON public.conversation_tags FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.conversations
  WHERE ((conversations.id = conversation_tags.conversation_id) AND (conversations.user_id = auth.uid())))));


--
-- Name: favorite_conversations Users can add to their favorite conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add to their favorite conversations" ON public.favorite_conversations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: favorite_messages Users can add to their favorite messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add to their favorite messages" ON public.favorite_messages FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: shared_conversations Users can create shares for their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create shares for their conversations" ON public.shared_conversations FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.conversations
  WHERE ((conversations.id = shared_conversations.conversation_id) AND (conversations.user_id = auth.uid())))));


--
-- Name: conversation_folders Users can create their own folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own folders" ON public.conversation_folders FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: conversation_tags Users can delete tags from their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete tags from their conversations" ON public.conversation_tags FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.conversations
  WHERE ((conversations.id = conversation_tags.conversation_id) AND (conversations.user_id = auth.uid())))));


--
-- Name: conversations Users can delete their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own conversations" ON public.conversations FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: conversation_folders Users can delete their own folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own folders" ON public.conversation_folders FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: shared_conversations Users can delete their shared conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their shared conversations" ON public.shared_conversations FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.conversations
  WHERE ((conversations.id = shared_conversations.conversation_id) AND (conversations.user_id = auth.uid())))));


--
-- Name: chat_messages Users can insert messages to their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert messages to their conversations" ON public.chat_messages FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.conversations
  WHERE ((conversations.id = chat_messages.conversation_id) AND (conversations.user_id = auth.uid())))));


--
-- Name: conversations Users can insert their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own conversations" ON public.conversations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_preferences Users can insert their own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: favorite_conversations Users can remove from their favorite conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can remove from their favorite conversations" ON public.favorite_conversations FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: favorite_messages Users can remove from their favorite messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can remove from their favorite messages" ON public.favorite_messages FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: conversations Users can update their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own conversations" ON public.conversations FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: conversation_folders Users can update their own folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own folders" ON public.conversation_folders FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_preferences Users can update their own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own preferences" ON public.user_preferences FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: shared_conversations Users can update their shared conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their shared conversations" ON public.shared_conversations FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.conversations
  WHERE ((conversations.id = shared_conversations.conversation_id) AND (conversations.user_id = auth.uid())))));


--
-- Name: chat_messages Users can view messages from their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages from their conversations" ON public.chat_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.conversations
  WHERE ((conversations.id = chat_messages.conversation_id) AND (conversations.user_id = auth.uid())))));


--
-- Name: conversation_tags Users can view tags for their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view tags for their conversations" ON public.conversation_tags FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.conversations
  WHERE ((conversations.id = conversation_tags.conversation_id) AND (conversations.user_id = auth.uid())))));


--
-- Name: conversations Users can view their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own conversations" ON public.conversations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: favorite_conversations Users can view their own favorite conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own favorite conversations" ON public.favorite_conversations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: favorite_messages Users can view their own favorite messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own favorite messages" ON public.favorite_messages FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: conversation_folders Users can view their own folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own folders" ON public.conversation_folders FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_preferences Users can view their own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own preferences" ON public.user_preferences FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: chat_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: conversation_folders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversation_folders ENABLE ROW LEVEL SECURITY;

--
-- Name: conversation_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversation_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: conversation_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversation_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: favorite_conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.favorite_conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: favorite_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.favorite_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: shared_conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shared_conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: user_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;