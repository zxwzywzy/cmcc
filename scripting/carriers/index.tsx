import { Navigation, Script } from 'scripting'
import { Home } from './mobile/index'
async function main(){
 await Navigation.present({element:<Home/>,modalPresentationStyle:'fullScreen',swipeBackBehavior:'dismiss'})
 Script.exit()
}
main()
