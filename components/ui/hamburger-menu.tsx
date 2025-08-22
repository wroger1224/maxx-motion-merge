import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { StyleSheet } from 'react-native';


const HamburgerMenu = () => {
	return (
		<GestureHandlerRootView>
      <Drawer 
				screenOptions={{
    			drawerStyle: {
						width: "50%",
   			 	},
  			}}
			>
        <Drawer.Screen
          name="index"
          options={{
            title: 'Dashboard',
          }}
        />
        <Drawer.Screen
          name="activity"
          options={{
            title: 'Activity',
          }}
        />
        <Drawer.Screen
          name="team"
          options={{
            title: 'Team',
          }}
        />
        <Drawer.Screen
          name="leaderboard"
          options={{
            title: 'Leaderboard',
          }}
        />
        <Drawer.Screen
          name="achievements"
          options={{
            title: 'Achievements',
          }}
        />
        <Drawer.Screen
          name="profile"
          options={{
            title: 'Profile',
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
	)
}

export default HamburgerMenu;