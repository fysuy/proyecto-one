/*
 * Queries.java
 *
 * MDK 4.0.1 - Clase que define las sentencias SQL.
 *
 * 06/03/2016
 *
 * Copyright Drintin© 2016
 */
package uy.com.karibe.access;

public class Queries {	
	public static String insertIsland() {
		String s = "insert into mdk.islands(x, y, width, height, gameId) values (?, ?, ?, ?, ?)";
		return s;
	}
	
	public static String deleteIslands() {
		String s = "delete from mdk.islands where gameId = ?";
		return s;
	}
	
	public static String deletePorts() {
		String s = "delete from mdk.ports where gameId = ?";
		return s;
	}
	
	public static String deleteShips() {
		String s = "delete from mdk.ships where gameId = ?";
		return s;
	}
	
	public static String insertPort() {
		String s = "insert into mdk.ports(name, x, gameId) values (?, ?, ?)";
		return s;
	}
	
	public static String insertShip() {
		String s = "insert into mdk.ships(name, x, y, rotation, health, gameId) values (?, ?, ?, ?, ?, ?)";
		return s;
	}
	
	public static String selectPorts() {
		String s = "select * from mdk.ports where gameId = ?";
		return s;
	}
	
	public static String selectIslands() {
		String s = "select * from mdk.islands where gameId = ?";
		return s;
	}
	
	public static String selectShips() {
		String s = "select * from mdk.ships where gameId = ?";
		return s;
	}
}