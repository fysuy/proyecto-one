package uy.com.karibe.websocket;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Random;
import java.util.Set;

import javax.websocket.OnClose;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;

import com.google.gson.Gson;

@ServerEndpoint("/wsServerEndpoint")
public class WebSocketServerEndpoint {
	
	public class JsonMsg {
		private String id;
		private String message;
		
		public JsonMsg(String id, String message) {
			this.id = id;
			this.message = message;
		}
	}

	private static final Set<Session> sessions = Collections.synchronizedSet(new HashSet<Session>());
	private static final ArrayList<String> roles = new ArrayList<String>(){{
		add("submarine");
		add("blue");
		add("green");
	}};
	private static final HashMap<String, String> players = new HashMap<String, String>();
	
	public WebSocketServerEndpoint() {}
	
	@OnOpen
	public void onOpen(Session session){
		try {
			Random random = new Random();
			int rnd = random.nextInt(roles.size());
			String role = roles.get(rnd);
			
			sessions.add(session);
			players.put(session.getId(), role);
			roles.remove(rnd);
			
			JsonMsg msg = new JsonMsg("setRole", role);
			
			session.getBasicRemote().sendText(new Gson().toJson(msg));
			
			if(roles.size() == 0) {
				JsonMsg initMsg = new JsonMsg("initGame", "true");
				sendMessageToAll(new Gson().toJson(initMsg), session, true);
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	@OnClose
	public void onClose(Session session){
		sessions.remove(session);
		String role = (String)players.get(session.getId());
		players.remove(session.getId());
		roles.add(role);
	}

	@OnMessage
	public void onMessage(String message, Session session){
		sendMessageToAll(message, session, false);
	}

//	private String buildJsonData(String user, String msg) {
//
//		JsonReader jsonReader = Json.createReader(new StringReader(msg));
//		JsonObject jsonObj = jsonReader.readObject();
//		jsonReader.close();
//
//		JsonObject jsonObject = Json.createObjectBuilder()
//				.add("user", user)
//				.add("x", jsonObj.getInt("x"))
//				.add("y", jsonObj.getInt("y"))
//				.add("angle", jsonObj.getInt("angle"))
//				.build();
//
//		StringWriter stringWriter = new StringWriter();
//		try (JsonWriter jsonWriter = Json.createWriter(stringWriter)) {jsonWriter.write(jsonObject);}
//
//		return stringWriter.toString();
//	}

	private void sendMessageToAll(String message, Session session, boolean includeSelf) {
		for(Session s : sessions){
			try {
				if(s.getId() != session.getId() || includeSelf) {
					s.getBasicRemote().sendText(message);
				}
			} catch (IOException ex) {
				System.out.println(ex.getMessage());
			}
		}
	}
}