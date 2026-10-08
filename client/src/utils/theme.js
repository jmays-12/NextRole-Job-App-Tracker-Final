export const theme = {};
// initialize empty theme object first so we can inherit from other components
theme.page = `flex flex-col items-center justify-center min-h-screen relative overflow-hidden`

theme.container = `mb-30 mt-10 rounded-lg max-w-3xl p-4 shadow-lg bg-gray-50`
theme.header = `flex items-center gap-3 mb-1`
theme.title = `text-3xl font-bold mb-3 tracking-tight`
theme.tagline = `pb-2 mr-auto tracking-wide`
theme.username = `text-gray-800 underline pt-2`
theme.userControls = `ml-auto flex gap-3 mb-3`

theme.appFormCard = `px-3 py-6 mb-3`
theme.card = `border rounded p-3 mb-3 shadow-sm border-gray-500`

theme.helpButton = `border rounded-full w-6 h-6 flex items-center justify-center cursor-help mt-2`
theme.helpPopup = `text-center absolute left-40 top-2 z-50 w-90 rounded border bg-white p-2 shadow-lg text-sm text-gray-600 space-y-1`
theme.helpPopupTitle = `text-base`
theme.helpClose = `absolute top-0.5 right-2 text-gray-500 hover:text-gray-800 cursor-pointer text-sm`


theme.button = `border rounded-lg px-2 py-0.5 m-1 text-gray-700 hover:bg-gray-100`
theme.buttonDanger = `${theme.button} text-red-600 hover:bg-red-100`
theme.logoutButton = `${theme.button} tracking-tight`
theme.editButtons = `ml-auto flex gap-3`

theme.statusRow = `flex flex-wrap gap-2 mt-3`
theme.chipBase = `border rounded-full px-3 py-1 text-sm capitalize cursor-pointer`
theme.chipOff = `${theme.chipBase} text-gray-500 hover:bg-gray-100`
theme.chipOn = {
    applied: `${theme.chipBase} bg-blue-100 text-blue-800 border-blue-300`,
    interviewing: `${theme.chipBase} bg-yellow-100 text-yellow-800 border-yellow-300`,
    offer: `${theme.chipBase} bg-green-100 text-green-800 border-green-300`,
    rejected: `${theme.chipBase} bg-red-100 text-red-800 border-red-300`,
    withdrawn: `${theme.chipBase} bg-gray-200 text-gray-700 border-gray-400`,
}
theme.chipOnAll = `${theme.chipBase} bg-gray-800 text-white border-gray-800`
theme.filterRow = `flex flex-wrap gap-2 mb-3`


theme.companyName = `capitalize underline text-2xl m-1 text-gray-900`
theme.role = `text-gray-600 text-sm m-1 block`
theme.date = `text-sm text-gray-600 m-1`
theme.companyWebsite = `${theme.date}`
theme.appLink = `underline text-blue-500 text-sm block m-1`

theme.notes = `border rounded border-gray-500 p-2 bg-[repeating-linear-gradient(to_bottom,#fffbeb_0px,#fffbeb_27px,#fde68a_28px)] text-sm text-gray-900 m-1 whitespace-pre-line leading-4`
theme.notesTitle = `text-base block m-1 text-gray-600`



theme.input = `border rounded px-2 py-1 w-full mb-2 bg-white`

theme.searchRow = `flex items-center gap-3 mb-2`
theme.searchInput = `border rounded px-2 py-1 flex-1 bg-white`


theme.switchText = `mt-3`
theme.error = `text-red-600 mb-2`
theme.row = `flex gap-2 items-center`
theme.link = `underline cursor-pointer hover:text-gray-500`
theme.info = `text-center mt-10 text-gray-500`
theme.loading = `text-gray-500`

theme.sortWrap = `ml-auto flex items-center gap-1 -mr-1 text-sm text-gray-600`
theme.sortBy = `rounded px-1 py-1 bg-transparent text-sm cursor-pointer hover:bg-gray-100`