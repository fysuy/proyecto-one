/*
 * GameService.java
 *
 * MDK 4.0.1 - Esta es la clase de configuracion de jersey, en la cual definimos las clases que se implementan los servicios.
 *
 * 06/03/2016
 *
 * Copyright Drintin© 2016
 */
package uy.com.karibe.rest;
import java.util.HashSet;
import java.util.Set;

import javax.ws.rs.ApplicationPath;
import javax.ws.rs.core.Application;

@ApplicationPath("/rest")
public class GameService extends Application {
	public GameService() {}	
	// Agregamos al metodo que especifica jersey las clases que implementaran
	// los servicios de la aplicacion.
	@Override
	public Set<Class<?>> getClasses( )
	{
		final Set<Class<?>> services = new HashSet<Class<?>>( );
		services.add(MapService.class);
		services.add(ShipService.class);
		return services;
	}
}