/*
 * MapService.java
 *
 * MDK 4.0.1 - Implementacion de los servicios REST para el mapa
 *
 * 06/03/2016
 *
 * Copyright Drintin© 2016
 */
package uy.com.karibe.rest;

import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.List;

import javax.inject.Singleton;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;

import com.google.gson.Gson;
import com.mysql.jdbc.Connection;

import uy.com.karibe.access.DatabaseAccess;
import uy.com.karibe.domain.Island;
import uy.com.karibe.domain.Port;

@Path("/map")
@Singleton
public class MapService {
	private Connection con;
	
	public MapService() {
		String driver = "com.mysql.jdbc.Driver";
		try {
			Class.forName(driver);
			String url = "jdbc:mysql://localhost:3306/mdk";
			con = (Connection) DriverManager
					.getConnection(url, "root", "toor");
		} catch (ClassNotFoundException | SQLException e) {
			e.printStackTrace();
		}
	}
	
	@GET
	@Path("/islands/{gId}")
	@Produces(MediaType.APPLICATION_JSON)
	public String getIslands (@PathParam("gId") int gameId) {
		List<Island> islands = DatabaseAccess.selectIslands(con, gameId);
		return new Gson().toJson(islands);
	}
	
	@GET
	@Path("/ports/{gId}")
	@Produces(MediaType.APPLICATION_JSON)
	public String getPorts (@PathParam("gId") int gameId) {
		List<Port> ports = DatabaseAccess.selectPorts(con, gameId);
		return new Gson().toJson(ports);
	}
	
	@POST
	@Produces(MediaType.TEXT_PLAIN)
	@Path("/islands/{gId}")
	public String saveIslands(@PathParam("gId") int gameId, String jsonIslands) {	
		try {
			Island[] islands = new Gson().fromJson(jsonIslands, Island[].class);
			
			DatabaseAccess.deleteIslands(con, gameId);
			
			for (Island island : islands) {
				DatabaseAccess.insertIsland(con, gameId, island);
			}
		} catch (Exception e) {
			e.printStackTrace();
			return e.getMessage();
		}
		
		return "success";
	}

	@POST
	@Produces(MediaType.TEXT_PLAIN)
	@Path("/ports/{gId}")
	public String savePorts(@PathParam("gId") int gameId, String jsonPorts) {	
		try {
			Port[] ports = new Gson().fromJson(jsonPorts, Port[].class);
			
			DatabaseAccess.deletePorts(con, gameId);
			
			for (Port p : ports) {
				DatabaseAccess.insertPort(con, gameId, p);
			}
		} catch (Exception e) {
			e.printStackTrace();
			return e.getMessage();
		}
		
		return "success";
	}
}