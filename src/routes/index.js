import React from 'react';
import {Switch, Route, Redirect} from 'react-router-dom';
import productionRoutes from './production/index';


function renderRoute (route, key) {
  if (route.layout) {
    return(
      <Route
        exact={route.exact}
        path={route.path}
        render={props => (
          <route.layout>
            <route.component {...props}/>
          </route.layout>
        )}
        key={key}
      />
    );
  } else {
    return <div></div>
  }

}

function renderRoutes (routes){
  return (
    routes.map((prop, key) => {
      if (prop.redirect)
        return <Redirect from={prop.path} to={prop.to} key={key} />;
      return renderRoute(prop, key);
    })
  );
}

const Index = () => (
  <Switch>
    { renderRoutes(productionRoutes) }
    {/* <Route
      render={props => (
        <TemplateSidebar>
          <Error {...props} title="404" content="Sorry, the route you requested does not exist"/>
        </TemplateSidebar>
      )}
    /> */}

  </Switch>
);

export default Index;
