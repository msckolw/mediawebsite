import React, {useState} from 'react';
import {render, screen, fireEvent} from '@testing-library/react';
import SourceModal from './SourceModal';

const types=[{_id:'left',source_type:'Left'},{_id:'center',source_type:'Center'}];
function fill(row, type, url) {
  fireEvent.change(screen.getByLabelText(`Source type ${row}`),{target:{value:type}});
  fireEvent.change(screen.getByLabelText(`Source information ${row}`),{target:{value:url}});
}
const base={isOpen:true,onClose:jest.fn(),initialSources:[],typeList:types};

test('saves three manual sources, including multiple URLs of the same type',()=>{
  const onSave=jest.fn();render(<SourceModal {...base} onSave={onSave}/>);
  fill(1,'Left','https://one.example/story');
  fireEvent.click(screen.getByLabelText('Add another source'));
  fill(2,'Left','https://two.example/story');
  fireEvent.click(screen.getByLabelText('Add another source'));
  fill(3,'Center',' https://three.example/story ');
  fireEvent.click(screen.getByLabelText('Save sources'));
  expect(onSave).toHaveBeenCalledWith([
    {_id:'left',source_type:'Left',url:'https://one.example/story'},
    {_id:'left',source_type:'Left',url:'https://two.example/story'},
    {_id:'center',source_type:'Center',url:'https://three.example/story'}
  ]);
});
test('refreshing source types or parent props does not erase an open draft',()=>{
  const onSave=jest.fn();const view=render(<SourceModal {...base} onSave={onSave}/>);
  fill(1,'Left','https://one.example/story');
  fireEvent.click(screen.getByLabelText('Add another source'));
  fill(2,'Center','https://two.example/story');
  view.rerender(<SourceModal {...base} initialSources={[]} typeList={types.map(t=>({...t}))} onSave={onSave}/>);
  expect(screen.getByLabelText('Source information 2').value).toBe('https://two.example/story');
  expect(screen.getByLabelText('Source information 1').value).toBe('https://one.example/story');
});
test('an incomplete second row is reported instead of silently discarded',()=>{
  const onSave=jest.fn();render(<SourceModal {...base} onSave={onSave}/>);
  fill(1,'Left','https://one.example/story');
  fireEvent.click(screen.getByLabelText('Add another source'));
  fireEvent.change(screen.getByLabelText('Source information 2'),{target:{value:'https://two.example/story'}});
  fireEvent.click(screen.getByLabelText('Save sources'));
  expect(onSave).not.toHaveBeenCalled();expect(screen.getByRole('alert').textContent).toContain('source 2');
  fireEvent.change(screen.getByLabelText('Source type 2'),{target:{value:'Center'}});
  fireEvent.click(screen.getByLabelText('Save sources'));
  expect(onSave.mock.calls[0][0]).toHaveLength(2);
});
test('saved sources survive closing and reopening; canceled edits are discarded',()=>{
  function Editor(){
    const [open,setOpen]=useState(true),[saved,setSaved]=useState([]);
    return <><button onClick={()=>setOpen(true)}>Reopen</button><SourceModal {...base} isOpen={open} initialSources={saved} onClose={()=>setOpen(false)} onSave={value=>{setSaved(value);setOpen(false);}}/></>;
  }
  render(<Editor/>);fill(1,'Left','https://one.example/story');
  fireEvent.click(screen.getByLabelText('Add another source'));fill(2,'Center','https://two.example/story');
  fireEvent.click(screen.getByLabelText('Save sources'));fireEvent.click(screen.getByText('Reopen'));
  expect(screen.getByLabelText('Source information 2').value).toBe('https://two.example/story');
  fireEvent.change(screen.getByLabelText('Source information 2'),{target:{value:'unsaved'}});
  fireEvent.click(screen.getByLabelText('Close'));fireEvent.click(screen.getByText('Reopen'));
  expect(screen.getByLabelText('Source information 2').value).toBe('https://two.example/story');
});
test('add, remove and save do not submit a containing article form',()=>{
  const submit=jest.fn(event=>event.preventDefault());const save=jest.fn();
  render(<form onSubmit={submit}><SourceModal {...base} onSave={save}/></form>);
  fill(1,'Left','https://one.example/story');fireEvent.click(screen.getByLabelText('Add another source'));
  fireEvent.click(screen.getByLabelText('Remove source 2'));fireEvent.click(screen.getByLabelText('Save sources'));
  expect(submit).not.toHaveBeenCalled();expect(save.mock.calls[0][0]).toHaveLength(1);
});
test('respects the row limit and ignores entirely blank rows when saving',()=>{
  const save=jest.fn();render(<SourceModal {...base} maxSources={2} onSave={save}/>);
  fill(1,'Left','https://one.example/story');fireEvent.click(screen.getByLabelText('Add another source'));
  expect(screen.getByLabelText('Add another source').disabled).toBe(true);
  fireEvent.click(screen.getByLabelText('Save sources'));
  expect(save.mock.calls[0][0]).toHaveLength(1);
});
