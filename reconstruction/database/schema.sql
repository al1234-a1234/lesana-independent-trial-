CREATE TABLE IF NOT EXISTS progress (owner text NOT NULL,line_id text NOT NULL,data jsonb NOT NULL,PRIMARY KEY(owner,line_id));
CREATE TABLE IF NOT EXISTS attempts (owner text NOT NULL,id text NOT NULL,line_id text NOT NULL,created_at bigint NOT NULL,PRIMARY KEY(owner,id));
CREATE TABLE IF NOT EXISTS favorite_words (owner text NOT NULL,word text NOT NULL,PRIMARY KEY(owner,word));
CREATE TABLE IF NOT EXISTS known_words (owner text NOT NULL,word text NOT NULL,PRIMARY KEY(owner,word));
CREATE TABLE IF NOT EXISTS core_groups (owner text NOT NULL,group_id text NOT NULL,score integer NOT NULL,completed_at bigint NOT NULL,PRIMARY KEY(owner,group_id));
CREATE TABLE IF NOT EXISTS passage_progress (owner text NOT NULL,passage_id text NOT NULL,score integer NOT NULL,answered integer NOT NULL,completed_at bigint NOT NULL,PRIMARY KEY(owner,passage_id));
