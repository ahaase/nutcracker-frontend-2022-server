
--
-- Name: user_session; Type: TABLE; Schema: public; Owner: vello
--

CREATE TABLE user_session (
    api_key VARCHAR(100) UNIQUE NOT NULL,
    created INTEGER,
    last_used INTEGER
);

ALTER TABLE user_session OWNER TO vello;

--
-- Name: item; Type: TABLE; Schema: public; Owner: vello
--

CREATE TABLE item (
    uuid VARCHAR(100) NOT NULL,
    api_key VARCHAR(100) NOT NULL,
    description TEXT DEFAULT '',
    done BOOLEAN DEFAULT false,
    do_before INTEGER
);

ALTER TABLE item OWNER TO vello;

--
-- Name: log; Type: TABLE; Schema: public; Owner: vello
--

CREATE TABLE log (
    message TEXT,
    type VARCHAR(10),
    timestamp INTEGER
);

ALTER TABLE log OWNER TO vello;
