import React from 'react';
import { StyleSheet, ImageBackground, ImageSourcePropType, Dimensions } from 'react-native';
export function ResponsiveHeader({ 
  source, 
  style = {},
	children
}: { 
	source: ImageSourcePropType,
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <ImageBackground
        source={ source }
        style={[styles.headerBackground, style ]}
        resizeMode="cover"
    >
         { children }
    </ImageBackground>
  );
}

const height  = Dimensions.get('window').height * .2;
const styles = StyleSheet.create({
	headerBackground: {
		height: height, 
	},

}); 