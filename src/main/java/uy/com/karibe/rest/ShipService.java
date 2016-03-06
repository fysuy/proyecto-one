/*
 * MapService.java
 *
 * MDK 4.0.1 - Implementacion de los servicios REST para las naves
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
import uy.com.karibe.domain.Ship;

@Path("/ships")
@Singleton
public class ShipService {
	private Connection con;
	
	public ShipService() {
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
	@Path("{gId}")
	@Produces(MediaType.APPLICATION_JSON)
	public String getShips (@PathParam("gId") int gameId) {
		List<Ship> ships = DatabaseAccess.selectShips(con, gameId);
		return new Gson().toJson(ships);
	}
	
	@POST
	@Path("{gId}")
	@Produces(MediaType.TEXT_PLAIN)
	public String saveShips(@PathParam("gId") int gameId, String jsonShips) {	
		try {
			Ship[] ships = new Gson().fromJson(jsonShips, Ship[].class);
			
			DatabaseAccess.deleteShips(con, gameId);
			
			for (Ship ship : ships) {
				DatabaseAccess.insertShip(con, gameId, ship);
			}
		} catch (Exception e) {
			e.printStackTrace();
			return e.getMessage();
		}
		
		return "success";
	}
}