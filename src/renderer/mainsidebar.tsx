/**
 * React renderer.
 */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'react-icons-kit'
import styled from 'styled-components'
import {globe as dashboardIcon} from 'react-icons-kit/entypo/globe'
import {credit_card as transactionsIcon} from 'react-icons-kit/ikons/credit_card'
import {users as usersIcon} from 'react-icons-kit/entypo/users'
import { SideNav, Nav, NavContext } from 'react-sidenav'
import { Link } from 'react-router-dom';

const Container = styled.div`
  background: #2d353c;
  width: 200px;
  height: 360px;
  color: #a8acb1;  
  font-family: 'Roboto', sans-serif;
`

const FlexCont = styled.div<{selected: boolean}>`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 8px 12px;
  color: ${ props => props.selected ? '#FFF': 'inherit' };
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  background: ${ props => props.selected ? '#242a31': 'inherit'};
  &:hover {
    background: #242a31;
  }
`
const IconCont = styled.div<{selected: boolean}>`
  color: ${ props => props.selected ? '#00acac': 'inherit' };
  line-height: 16px;
`
const TextCont = styled.div`
  padding-left: 6px;
  line-height: 22px;
`
interface INavItemProp {
  icon: any
  title: string
}
const NavItem: React.FC<INavItemProp> = (props) => {
  const context = React.useContext(NavContext)

  return (
    <FlexCont selected={context.selected} >
      <IconCont selected={context.selected} ><Icon icon={props.icon}/></IconCont>
      <TextCont>{ props.title }</TextCont>
    </FlexCont>
  )
}

const NavTitle = styled.div`
  padding: 8px;
  font-size: 0.92em;
`
const SubTitle = styled.div<{ selected: boolean}>`
  display: flex;
  padding: 8px 22px;
  font-size: 0.88em;
  justify-content: flex-start;
  align-items: center;
  cursor: pointer;  
  color: ${ props => props.selected ? '#FFF': 'inherit' } !important;
  &:hover {
    color: #FFF !important;
  }
`
const SubTitleIndicator = styled.div<{selected: boolean}>`
  border-radius: 50%;
  width: 6px;
  height: 6px;
  background: ${ props => props.selected ? '#00acac': 'inherit' } !important;    
`

const SubNavItem: React.FC = (props) => {
  const context = React.useContext(NavContext)  
  return (
    <SubTitle selected={context.selected}>
      <SubTitleIndicator selected={context.selected}/>
      <div style={{padding: 4}}>{ props.children }</div>
    </SubTitle>
  )
}

/**
 * Parameters for the display.
 */
type MainSidebarProps = {
  sidebarOpen: boolean
}

/**
 * State of the display
 */
type MainSidebarState = {
  sidebarOpen: boolean
}

class MainSidebar extends React.Component<MainSidebarProps, MainSidebarState> {
  constructor(props: MainSidebarProps) {
    super(props);

    this.state = {
      sidebarOpen: true
    };

    this.onSetSidebarOpen = this.onSetSidebarOpen.bind(this);
  }

  onSetSidebarOpen(open: boolean) {
    this.setState({ sidebarOpen: open });
  }

  render() {
    return (
      <Container>
        <NavTitle>Navigation</NavTitle>
        <SideNav defaultSelectedPath="1" >
            <Nav id="1">
              <Link to='/'><NavItem icon={dashboardIcon} title={"Dashboard"}/></Link>
            </Nav>
            <Nav id="2">
            <NavItem icon={transactionsIcon} title={"Transactions"}/>
            <Nav id="1"> 
              <Link to='/adcp-terminal'><SubNavItem>Orders</SubNavItem></Link>
            </Nav>
            <Nav id="2">
                <SubNavItem>Refunds</SubNavItem>
            </Nav>
            <Nav id="3">
                <SubNavItem>Deliveries</SubNavItem>
            </Nav>
            </Nav>
            <Nav id="3">
            <NavItem icon={usersIcon} title={"Users"}/>
            </Nav>
        </SideNav>
      </Container>
    );
  }
}

export default  MainSidebar;
